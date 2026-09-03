from __future__ import annotations

from django.core.management.base import BaseCommand

from scoring.models_bank import BankClient, BankEnterprise, FinancialProduct, LoanApplication


def _candidate_owner_ids(*objects) -> set[int]:
    owner_ids: set[int] = set()
    for obj in objects:
        owner_id = getattr(obj, 'bank_owner_id', None)
        if owner_id:
            owner_ids.add(owner_id)
    return owner_ids


class Command(BaseCommand):
    help = "Realigne les donnees seed banque (clients, entreprises, produits, demandes) avec la bonne banque."

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='Affiche les corrections sans les appliquer.')

    def handle(self, *args, **options):
        dry_run = options['dry_run']

        counters = {
            'clients': 0,
            'enterprises': 0,
            'products': 0,
            'applications': 0,
        }

        for client in BankClient.objects.select_related('bank_owner').prefetch_related('applications__product'):
            if client.bank_owner_id:
                continue
            owner_ids = _candidate_owner_ids(*[
                app.enterprise for app in client.applications.all() if getattr(app, 'enterprise_id', None)
            ])
            owner_ids.update(_candidate_owner_ids(*[
                app.product for app in client.applications.all() if getattr(app, 'product_id', None)
            ]))
            owner_ids.update(_candidate_owner_ids(*list(client.applications.all())))
            if len(owner_ids) == 1:
                client.bank_owner_id = next(iter(owner_ids))
                counters['clients'] += 1
                if not dry_run:
                    client.save(update_fields=['bank_owner'])

        for enterprise in BankEnterprise.objects.select_related('bank_owner').prefetch_related('applications__product'):
            if enterprise.bank_owner_id:
                continue
            owner_ids = _candidate_owner_ids(*[
                app.product for app in enterprise.applications.all() if getattr(app, 'product_id', None)
            ])
            owner_ids.update(_candidate_owner_ids(*list(enterprise.applications.all())))
            if len(owner_ids) == 1:
                enterprise.bank_owner_id = next(iter(owner_ids))
                counters['enterprises'] += 1
                if not dry_run:
                    enterprise.save(update_fields=['bank_owner'])

        for product in FinancialProduct.objects.select_related('bank_owner').prefetch_related('applications__client', 'applications__enterprise'):
            if product.bank_owner_id:
                continue
            owner_ids = _candidate_owner_ids(*list(product.applications.all()))
            owner_ids.update(_candidate_owner_ids(*[
                app.client for app in product.applications.all() if getattr(app, 'client_id', None)
            ]))
            owner_ids.update(_candidate_owner_ids(*[
                app.enterprise for app in product.applications.all() if getattr(app, 'enterprise_id', None)
            ]))
            if len(owner_ids) == 1:
                product.bank_owner_id = next(iter(owner_ids))
                counters['products'] += 1
                if not dry_run:
                    product.save(update_fields=['bank_owner'])

        for application in LoanApplication.objects.select_related('client', 'enterprise', 'product', 'bank_owner'):
            owner_ids = _candidate_owner_ids(application.client, application.enterprise, application.product)
            if application.bank_owner_id:
                owner_ids.add(application.bank_owner_id)

            if len(owner_ids) == 1:
                inferred_owner_id = next(iter(owner_ids))
                if application.bank_owner_id != inferred_owner_id:
                    application.bank_owner_id = inferred_owner_id
                    counters['applications'] += 1
                    if not dry_run:
                        application.save(update_fields=['bank_owner'])

        mode_label = 'simulation' if dry_run else 'applique'
        self.stdout.write(self.style.SUCCESS(f"Realignement {mode_label}:"))
        self.stdout.write(f"  - Clients: {counters['clients']}")
        self.stdout.write(f"  - Entreprises: {counters['enterprises']}")
        self.stdout.write(f"  - Produits: {counters['products']}")
        self.stdout.write(f"  - Demandes: {counters['applications']}")
