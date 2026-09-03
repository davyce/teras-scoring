# backend/ai/management/commands/index_teras_pdfs_batch.py
"""
Indexation par lots avec gestion rate limit Cohere
Usage: python manage.py index_teras_pdfs_batch --batch-size 5
"""

from django.core.management.base import BaseCommand
from ai.document_indexer import get_indexer
from ai.models import IndexedDocument
import PyPDF2
import os
from pathlib import Path
import hashlib
import time


class Command(BaseCommand):
    help = 'Indexe PDFs par lots avec pause entre chaque lot'
    
    def add_arguments(self, parser):
        parser.add_argument('--pdf-dir', type=str, default='./documents/pdfs')
        parser.add_argument('--batch-size', type=int, default=3, help='Nombre PDFs par lot')
        parser.add_argument('--pause', type=int, default=70, help='Pause entre lots (secondes)')
        parser.add_argument('--force', action='store_true')
    
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('📚 Indexation PDFs par lots...'))
        
        pdf_dir = options['pdf_dir']
        batch_size = options['batch_size']
        pause_duration = options['pause']
        force = options['force']
        
        if not os.path.exists(pdf_dir):
            self.stdout.write(self.style.ERROR(f'❌ Dossier introuvable: {pdf_dir}'))
            return
        
        # Trouver tous les PDFs
        all_pdfs = list(Path(pdf_dir).glob('*.pdf'))
        
        if not all_pdfs:
            self.stdout.write(self.style.WARNING(f'⚠️ Aucun PDF trouvé'))
            return
        
        # Filtrer PDFs déjà indexés
        pdfs_to_index = []
        for pdf_path in all_pdfs:
            try:
                text = self.extract_text_from_pdf(str(pdf_path))
                if text and len(text.strip()) >= 100:
                    content_hash = hashlib.sha256(text.encode()).hexdigest()[:16]
                    if force or not IndexedDocument.objects.filter(content_hash=content_hash).exists():
                        pdfs_to_index.append((pdf_path, text, content_hash))
            except Exception:
                pass
        
        total_pdfs = len(pdfs_to_index)
        self.stdout.write(f'📄 {total_pdfs} PDF(s) à indexer')
        
        if total_pdfs == 0:
            self.stdout.write(self.style.SUCCESS('✅ Tous les PDFs sont déjà indexés!'))
            return
        
        # Calculer nombre de lots
        num_batches = (total_pdfs + batch_size - 1) // batch_size
        self.stdout.write(f'📦 {num_batches} lot(s) de {batch_size} PDFs')
        self.stdout.write(f'⏱️ Pause {pause_duration}s entre chaque lot\n')
        
        indexer = get_indexer()
        total_indexed = 0
        total_errors = 0
        
        # Indexation par lots
        for batch_num in range(num_batches):
            start_idx = batch_num * batch_size
            end_idx = min(start_idx + batch_size, total_pdfs)
            batch = pdfs_to_index[start_idx:end_idx]
            
            self.stdout.write(self.style.SUCCESS(f'\n📦 LOT {batch_num + 1}/{num_batches}'))
            self.stdout.write('=' * 60)
            
            batch_indexed = 0
            batch_errors = 0
            
            for pdf_path, text, content_hash in batch:
                try:
                    self.stdout.write(f'\n📖 {pdf_path.name}')
                    
                    # Type de document
                    filename = pdf_path.stem.lower()
                    if 'loi' in filename or 'jo-' in filename or 'convention' in filename:
                        doc_type = 'legislation'
                        category = 'legal'
                    elif 'teras' in filename or 'algo' in filename or 'api' in filename:
                        doc_type = 'documentation'
                        category = 'technical'
                    else:
                        doc_type = 'documentation'
                        category = 'general'
                    
                    # Indexer
                    result = indexer.index_document(
                        title=self.format_title(pdf_path.stem),
                        content=text,
                        document_type=doc_type,
                        source=f'PDF: {pdf_path.name}',
                        metadata={
                            'filename': pdf_path.name,
                            'category': category,
                            'format': 'pdf',
                            'priority': 8,
                            'content_hash': content_hash
                        }
                    )
                    
                    if result:
                        self.stdout.write(self.style.SUCCESS(f'  ✅ {result.chunk_count} chunks'))
                        batch_indexed += 1
                        total_indexed += 1
                    
                except Exception as e:
                    error_msg = str(e)
                    if 'rate limit' in error_msg.lower():
                        self.stdout.write(self.style.ERROR(f'  ❌ RATE LIMIT atteint'))
                        self.stdout.write(self.style.WARNING(f'  ⏸️ Pause forcée 90s...'))
                        time.sleep(90)
                        # Réessayer
                        try:
                            result = indexer.index_document(
                                title=self.format_title(pdf_path.stem),
                                content=text,
                                document_type=doc_type,
                                source=f'PDF: {pdf_path.name}',
                                metadata={'filename': pdf_path.name, 'category': category}
                            )
                            if result:
                                self.stdout.write(self.style.SUCCESS(f'  ✅ {result.chunk_count} chunks (retry)'))
                                batch_indexed += 1
                                total_indexed += 1
                        except Exception:
                            batch_errors += 1
                            total_errors += 1
                    else:
                        self.stdout.write(self.style.ERROR(f'  ❌ Erreur: {error_msg[:100]}'))
                        batch_errors += 1
                        total_errors += 1
            
            # Stats lot
            self.stdout.write(f'\n📊 Lot {batch_num + 1}: {batch_indexed} indexés, {batch_errors} erreurs')
            
            # Pause entre lots (sauf dernier)
            if batch_num < num_batches - 1:
                self.stdout.write(self.style.WARNING(f'\n⏸️ Pause {pause_duration}s avant lot suivant...'))
                for remaining in range(pause_duration, 0, -10):
                    self.stdout.write(f'  ⏱️ {remaining}s restantes...', ending='\r')
                    time.sleep(10)
                self.stdout.write('')
        
        # Résumé final
        self.stdout.write('\n' + '=' * 60)
        self.stdout.write(self.style.SUCCESS(f'✅ TOTAL INDEXÉS: {total_indexed}/{total_pdfs}'))
        self.stdout.write(self.style.ERROR(f'❌ ERREURS: {total_errors}'))
        
        # Stats ChromaDB
        stats = indexer.get_collection_stats()
        self.stdout.write('\n📊 ChromaDB:')
        for name, stat in stats.items():
            if isinstance(stat, dict):
                count = stat.get('count', 0)
                if count > 0:
                    self.stdout.write(f'  - {name}: {count} docs')
    
    def extract_text_from_pdf(self, pdf_path):
        """Extrait texte d'un PDF"""
        text = ""
        try:
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page_num, page in enumerate(pdf_reader.pages, 1):
                    page_text = page.extract_text()
                    if page_text:
                        text += f"\n\n--- Page {page_num} ---\n\n{page_text}"
        except Exception as e:
            raise Exception(f"Extraction PDF: {str(e)}")
        return text.strip()
    
    def format_title(self, filename):
        """Formatte titre"""
        title = filename.replace('_', ' ').replace('-', ' ')
        title = ' '.join(word.capitalize() for word in title.split())
        return title
