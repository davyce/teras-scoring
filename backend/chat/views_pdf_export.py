import json
import traceback
from django.http import HttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .chat_pdf_export import generate_chat_pdf


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def export_chat_pdf(request):
    try:
        # Parser le body manuellement si request.data est vide
        if request.data:
            data = request.data
        else:
            data = json.loads(request.body)

        messages  = data.get('messages', [])
        title     = data.get('title', 'Conversation TERAS')
        doc_count = int(data.get('doc_count', 0))
        model     = data.get('model', 'Claude Sonnet 4')

        if not messages:
            return Response({'error': 'Aucun message'}, status=400)

        pdf_bytes = generate_chat_pdf(
            messages=messages,
            conv_title=title,
            doc_count=doc_count,
            model=model,
        )

        filename = ''.join(c if c.isalnum() or c in '-_' else '_' for c in title)[:40] + '.pdf'
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        response['Content-Length'] = len(pdf_bytes)
        response['Access-Control-Expose-Headers'] = 'Content-Disposition'
        return response

    except Exception as e:
        print(f"❌ export_chat_pdf error: {e}")
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def export_conversation_pdf(request, conversation_id):
    try:
        from .models import Conversation
        conv = Conversation.objects.filter(id=conversation_id, user=request.user).first()
        if not conv:
            return Response({'error': 'Conversation introuvable'}, status=404)

        messages = [
            {
                'role': m.role,
                'content': m.content,
                'timestamp': m.timestamp.isoformat() if hasattr(m.timestamp, 'isoformat') else str(m.timestamp),
                'sources': m.metadata.get('sources', []) if m.metadata else [],
            }
            for m in conv.messages.order_by('timestamp')
        ]

        pdf_bytes = generate_chat_pdf(messages=messages, conv_title=conv.title)
        filename = ''.join(c if c.isalnum() or c in '-_' else '_' for c in conv.title)[:40] + '.pdf'
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        response['Content-Length'] = len(pdf_bytes)
        return response

    except Exception as e:
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)
