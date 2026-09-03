# backend/legislation/models.py
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class LegislationDocument(models.Model):
    TYPE_CHOICES = [
        ('law', 'Loi'), ('regulation', 'Règlement'),
        ('directive', 'Directive'), ('circular', 'Circulaire'),
    ]
    STATUS_CHOICES = [
        ('draft', 'Brouillon'), ('active', 'Actif'), ('archived', 'Archivé'),
    ]
    COUNTRY_CHOICES = [
        ('CEMAC', 'CEMAC'), ('CM', 'Cameroun'), ('CF', 'Centrafrique'),
        ('CG', 'Congo'), ('GA', 'Gabon'), ('GQ', 'Guinée Équatoriale'), ('TD', 'Tchad'),
    ]
    title = models.CharField(max_length=500)
    reference = models.CharField(max_length=100, unique=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    category = models.CharField(max_length=100)
    country = models.CharField(max_length=10, choices=COUNTRY_CHOICES)
    publication_date = models.DateField()
    effective_date = models.DateField()
    summary = models.TextField()
    full_text = models.TextField(blank=True, null=True)
    file = models.FileField(upload_to='legislation/%Y/%m/', blank=True, null=True)
    file_size = models.IntegerField(null=True, blank=True)
    file_type = models.CharField(max_length=50, blank=True)
    tags = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    ai_analysis = models.JSONField(null=True, blank=True)
    ai_analyzed_at = models.DateTimeField(null=True, blank=True)
    extracted_text = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='legislation_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'legislation_documents'
        ordering = ['-publication_date']

    def __str__(self):
        return f"{self.reference} - {self.title}"

    @property
    def file_extension(self):
        return self.file.name.split('.')[-1].lower() if self.file else None


class LegislationComment(models.Model):
    document = models.ForeignKey(LegislationDocument, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'legislation_comments'
        ordering = ['-created_at']

    def __str__(self):
        return f"Comment by {self.user.username} on {self.document.reference}"
