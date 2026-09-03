# scoring/management/commands/setup_teras_admin.py
from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, User

GROUP_NAME = "TERAS_ADMIN"

class Command(BaseCommand):
    help = "Crée le groupe TERAS_ADMIN et (optionnel) y ajoute un utilisateur existant"

    def add_arguments(self, parser):
        parser.add_argument(
            "--username",
            type=str,
            help="Nom d'utilisateur à ajouter au groupe TERAS_ADMIN",
        )

    def handle(self, *args, **options):
        group, created = Group.objects.get_or_create(name=GROUP_NAME)
        if created:
            self.stdout.write(self.style.SUCCESS(f"Groupe '{GROUP_NAME}' créé."))
        else:
            self.stdout.write(self.style.WARNING(f"Groupe '{GROUP_NAME}' déjà existant."))

        username = options.get("username")
        if username:
            try:
                user = User.objects.get(username=username)
                user.groups.add(group)
                self.stdout.write(self.style.SUCCESS(f"Utilisateur '{username}' ajouté au groupe '{GROUP_NAME}'."))
            except User.DoesNotExist:
                self.stdout.write(self.style.ERROR(f"Utilisateur '{username}' introuvable. Crée-le d'abord (createsuperuser)."))

        self.stdout.write(self.style.SUCCESS("Setup TERAS Admin terminé."))
