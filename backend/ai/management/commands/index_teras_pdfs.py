# backend/ai/management/commands/index_teras_pdfs.py
from django.core.management.base import BaseCommand
from ai.document_indexer import get_indexer
from ai.models import IndexedDocument
import PyPDF2
import os
from pathlib import Path
import hashlib


class Command(BaseCommand):
    help = 'Indexe les PDFs TERAS dans ChromaDB'
    
    def add_arguments(self, parser):
        parser.add_argument('--pdf-dir', type=str, default='./documents/pdfs')
        parser.add_argument('--force', action='store_true')
    
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('📚 Indexation PDFs TERAS...'))
        
        pdf_dir = options['pdf_dir']
        force = options['force']
        
        if not os.path.exists(pdf_dir):
            self.stdout.write(self.style.ERROR(f'❌ Dossier introuvable: {pdf_dir}'))
            return
        
        pdf_files = list(Path(pdf_dir).glob('*.pdf'))
        
        if not pdf_files:
            self.stdout.write(self.style.WARNING(f'⚠️ Aucun PDF trouvé'))
            return
        
        self.stdout.write(f'📄 {len(pdf_files)} PDF(s) trouvé(s)')
        
        indexer = get_indexer()
        indexed_count = 0
        skipped_count = 0
        error_count = 0
        
        for pdf_path in pdf_files:
            try:
                self.stdout.write(f'\n📖 {pdf_path.name}')
                
                # Extraire texte
                text = self.extract_text_from_pdf(str(pdf_path))
                
                if not text or len(text.strip()) < 100:
                    self.stdout.write(self.style.WARNING('  ⚠️ PDF vide'))
                    skipped_count += 1
                    continue
                
                # Calculer hash pour détecter duplicatas
                content_hash = hashlib.sha256(text.encode()).hexdigest()[:16]
                
                # Vérifier si déjà indexé
                if not force:
                    existing = IndexedDocument.objects.filter(content_hash=content_hash).first()
                    if existing:
                        self.stdout.write(self.style.WARNING('  ⚠️ Déjà indexé'))
                        skipped_count += 1
                        continue
                
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
                
                # Indexer (SANS force_reindex)
                result = indexer.index_document(
                    title=self.format_title(pdf_path.stem),
                    content=text,
                    document_type=doc_type,
                    source=f'PDF: {pdf_path.name}',
                    metadata={
                        'filename': pdf_path.name,
                        'category': category,
                        'format': 'pdf',
                        'priority': 8
                    }
                )
                
                if result:
                    self.stdout.write(self.style.SUCCESS(f'  ✅ {result.chunk_count} chunks'))
                    indexed_count += 1
                else:
                    skipped_count += 1
                    
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  ❌ {str(e)}'))
                error_count += 1
        
        # Résumé
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS(f'✅ Indexés: {indexed_count}'))
        self.stdout.write(self.style.WARNING(f'⚠️ Ignorés: {skipped_count}'))
        self.stdout.write(self.style.ERROR(f'❌ Erreurs: {error_count}'))
        
        # Stats
        stats = indexer.get_collection_stats()
        self.stdout.write('\n📊 ChromaDB:')
        for name, stat in stats.items():
            if isinstance(stat, dict):
                self.stdout.write(f'  - {name}: {stat.get("count", 0)} docs')
    
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
