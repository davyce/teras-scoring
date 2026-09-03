# backend/scripts/create_test_government_data.py
"""
Script de génération de données de test pour l'interface Government
Crée: compte government, régions, secteurs, alertes, rapports
"""

import os
import sys
import django
from datetime import datetime, timedelta
from decimal import Decimal

# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from scoring.models_government import (
    Region, Sector, Alert, GovernmentReport,
    GovernmentSettings, ActivityLog
)

User = get_user_model()


def create_government_user():
    """Créer un utilisateur gouvernemental"""
    print("📋 Création du compte government...")
    
    user, created = User.objects.get_or_create(
        email='government@teras.com',
        defaults={
            'username': 'government_admin',
            'user_type': 'government',
            'is_active': True,
            'is_staff': False,
        }
    )
    
    if created:
        user.set_password('gov123')
        user.save()
        print(f"✅ Utilisateur government créé: {user.email}")
    else:
        print(f"ℹ️  Utilisateur government existe déjà: {user.email}")
    
    return user


def create_regions():
    """Créer les régions du Congo"""
    print("\n🗺️  Création des régions...")
    
    regions_data = [
        {
            'name': 'kinshasa',
            'code': 'KIN',
            'population': 15_000_000,
            'total_users': 3200,
            'active_users': 2560,
            'avg_score': 680,
            'gdp': Decimal('12500000000'),
            'unemployment_rate': Decimal('15.5'),
            'latitude': Decimal('-4.3250'),
            'longitude': Decimal('15.3222'),
        },
        {
            'name': 'lubumbashi',
            'code': 'LUB',
            'population': 2_500_000,
            'total_users': 1850,
            'active_users': 1480,
            'avg_score': 695,
            'gdp': Decimal('5200000000'),
            'unemployment_rate': Decimal('12.3'),
            'latitude': Decimal('-11.6792'),
            'longitude': Decimal('27.4714'),
        },
        {
            'name': 'goma',
            'code': 'GOM',
            'population': 1_200_000,
            'total_users': 980,
            'active_users': 735,
            'avg_score': 625,
            'gdp': Decimal('1800000000'),
            'unemployment_rate': Decimal('18.7'),
            'latitude': Decimal('-1.6745'),
            'longitude': Decimal('29.2336'),
        },
        {
            'name': 'kisangani',
            'code': 'KIS',
            'population': 1_500_000,
            'total_users': 720,
            'active_users': 540,
            'avg_score': 610,
            'gdp': Decimal('2100000000'),
            'unemployment_rate': Decimal('21.4'),
            'latitude': Decimal('0.5167'),
            'longitude': Decimal('25.1833'),
        },
        {
            'name': 'mbuji-mayi',
            'code': 'MBM',
            'population': 2_000_000,
            'total_users': 1100,
            'active_users': 825,
            'avg_score': 640,
            'gdp': Decimal('3500000000'),
            'unemployment_rate': Decimal('16.9'),
            'latitude': Decimal('-6.1369'),
            'longitude': Decimal('23.5897'),
        },
    ]
    
    for region_data in regions_data:
        region, created = Region.objects.get_or_create(
            name=region_data['name'],
            defaults=region_data
        )
        
        if created:
            print(f"✅ Région créée: {region.get_name_display()} - Score: {region.avg_score}")
        else:
            print(f"ℹ️  Région existe: {region.get_name_display()}")


def create_sectors():
    """Créer les secteurs économiques"""
    print("\n🏭 Création des secteurs...")
    
    sectors_data = [
        {
            'name': 'agriculture',
            'code': 'AGR',
            'total_enterprises': 2450,
            'avg_score': 645,
            'growth_rate': Decimal('12.5'),
            'gdp_contribution': Decimal('8500000000'),
            'employment': 125000,
        },
        {
            'name': 'industrie',
            'code': 'IND',
            'total_enterprises': 1850,
            'avg_score': 710,
            'growth_rate': Decimal('8.3'),
            'gdp_contribution': Decimal('15200000000'),
            'employment': 95000,
        },
        {
            'name': 'services',
            'code': 'SRV',
            'total_enterprises': 5200,
            'avg_score': 685,
            'growth_rate': Decimal('15.7'),
            'gdp_contribution': Decimal('11800000000'),
            'employment': 185000,
        },
        {
            'name': 'commerce',
            'code': 'COM',
            'total_enterprises': 6800,
            'avg_score': 650,
            'growth_rate': Decimal('11.2'),
            'gdp_contribution': Decimal('9400000000'),
            'employment': 142000,
        },
        {
            'name': 'sante',
            'code': 'SNT',
            'total_enterprises': 980,
            'avg_score': 720,
            'growth_rate': Decimal('9.8'),
            'gdp_contribution': Decimal('4200000000'),
            'employment': 65000,
        },
        {
            'name': 'technologie',
            'code': 'TEC',
            'total_enterprises': 450,
            'avg_score': 745,
            'growth_rate': Decimal('25.4'),
            'gdp_contribution': Decimal('2800000000'),
            'employment': 28000,
        },
    ]
    
    for sector_data in sectors_data:
        sector, created = Sector.objects.get_or_create(
            name=sector_data['name'],
            defaults=sector_data
        )
        
        if created:
            print(f"✅ Secteur créé: {sector.get_name_display()} - {sector.total_enterprises} entreprises")
        else:
            print(f"ℹ️  Secteur existe: {sector.get_name_display()}")


def create_alerts():
    """Créer des alertes de test"""
    print("\n⚠️  Création des alertes...")
    
    kinshasa = Region.objects.filter(name='kinshasa').first()
    agriculture = Sector.objects.filter(name='agriculture').first()
    technologie = Sector.objects.filter(name='technologie').first()
    
    alerts_data = [
        {
            'title': 'Baisse significative du score moyen à Kinshasa',
            'description': 'Le score TERAS moyen dans la région de Kinshasa a baissé de 15 points en 7 jours.',
            'severity': 'high',
            'category': 'economic',
            'region': kinshasa,
            'impact_score': 75,
            'affected_users': 3200,
            'recommendations': [
                'Analyser les causes de la baisse',
                'Contacter les entreprises concernées',
                'Mettre en place un plan de redressement'
            ]
        },
        {
            'title': 'Croissance exceptionnelle du secteur technologie',
            'description': 'Le secteur technologie affiche une croissance de +25% ce trimestre.',
            'severity': 'low',
            'category': 'economic',
            'sector': technologie,
            'impact_score': 90,
            'affected_users': 450,
            'recommendations': [
                'Maintenir les incitations fiscales',
                'Faciliter l\'accès au financement',
                'Renforcer la formation tech'
            ]
        },
        {
            'title': 'Retards dans les déclarations fiscales - Agriculture',
            'description': 'Plus de 40% des entreprises agricoles n\'ont pas déclaré leurs revenus Q3.',
            'severity': 'critical',
            'category': 'fiscal',
            'sector': agriculture,
            'impact_score': 65,
            'affected_users': 980,
            'recommendations': [
                'Rappel urgent aux entreprises',
                'Extension du délai de déclaration',
                'Simplification du processus'
            ]
        },
        {
            'title': 'Augmentation du taux de chômage à Goma',
            'description': 'Le taux de chômage à Goma est passé de 16% à 18.7% en 3 mois.',
            'severity': 'medium',
            'category': 'social',
            'region': Region.objects.filter(name='goma').first(),
            'impact_score': 70,
            'affected_users': 1200,
            'recommendations': [
                'Programme de création d\'emploi',
                'Soutien aux PME locales',
                'Formation professionnelle'
            ]
        },
    ]
    
    for alert_data in alerts_data:
        alert, created = Alert.objects.get_or_create(
            title=alert_data['title'],
            defaults=alert_data
        )
        
        if created:
            print(f"✅ Alerte créée: [{alert.get_severity_display()}] {alert.title}")
        else:
            print(f"ℹ️  Alerte existe: {alert.title}")


def create_reports(gov_user):
    """Créer des rapports de test"""
    print("\n📊 Création des rapports...")
    
    reports_data = [
        {
            'title': 'Rapport Mensuel Novembre 2024',
            'report_type': 'monthly',
            'status': 'ready',
            'period_start': datetime(2024, 11, 1).date(),
            'period_end': datetime(2024, 11, 30).date(),
            'summary': {
                'total_users': 7850,
                'new_users': 350,
                'avg_score': 676,
                'scores_calculated': 1240,
            },
            'generated_by': gov_user,
        },
        {
            'title': 'Rapport Trimestriel Q3 2024',
            'report_type': 'quarterly',
            'status': 'ready',
            'period_start': datetime(2024, 7, 1).date(),
            'period_end': datetime(2024, 9, 30).date(),
            'summary': {
                'total_users': 7500,
                'new_users': 1020,
                'avg_score': 668,
                'scores_calculated': 3680,
            },
            'generated_by': gov_user,
        },
    ]
    
    for report_data in reports_data:
        report, created = GovernmentReport.objects.get_or_create(
            title=report_data['title'],
            defaults=report_data
        )
        
        if created:
            print(f"✅ Rapport créé: {report.title}")
        else:
            print(f"ℹ️  Rapport existe: {report.title}")


def create_settings():
    """Créer les paramètres système"""
    print("\n⚙️  Création des paramètres...")
    
    settings, created = GovernmentSettings.objects.get_or_create(
        pk=1,
        defaults={
            'system_version': '1.0.0',
            'environment': 'production',
            'maintenance_mode': False,
            'scoring_profile': 'basic',
            'scoring_region': 'CEMAC',
            'scoring_country': 'Congo',
            'alerts_enabled': True,
            'email_notifications': True,
            'threshold_low_score': 400,
            'threshold_high_risk': 300,
            'api_rate_limit': 1000,
        }
    )
    
    if created:
        print("✅ Paramètres créés")
    else:
        print("ℹ️  Paramètres existent déjà")


def create_activity_logs(gov_user):
    """Créer des logs d'activité"""
    print("\n📝 Création des logs d'activité...")
    
    kinshasa = Region.objects.filter(name='kinshasa').first()
    
    for i in range(10):
        ActivityLog.objects.create(
            action='score_calculated',
            user=gov_user,
            user_type='individual',
            score=650 + (i * 10),
            region=kinshasa,
            details={'calculation_time': f'{i*0.5}s'}
        )
    
    print("✅ 10 logs d'activité créés")


def main():
    """Fonction principale"""
    print("\n" + "="*60)
    print("🚀 GÉNÉRATION DES DONNÉES DE TEST GOVERNMENT")
    print("="*60)
    
    try:
        # 1. Créer l'utilisateur government
        gov_user = create_government_user()
        
        # 2. Créer les régions
        create_regions()
        
        # 3. Créer les secteurs
        create_sectors()
        
        # 4. Créer les alertes
        create_alerts()
        
        # 5. Créer les rapports
        create_reports(gov_user)
        
        # 6. Créer les paramètres
        create_settings()
        
        # 7. Créer les logs
        create_activity_logs(gov_user)
        
        print("\n" + "="*60)
        print("✅ GÉNÉRATION TERMINÉE AVEC SUCCÈS !")
        print("="*60)
        print("\n📋 COMPTE GOVERNMENT CRÉÉ:")
        print(f"   Email: government@teras.com")
        print(f"   Mot de passe: gov123")
        print(f"\n📊 DONNÉES CRÉÉES:")
        print(f"   - Régions: {Region.objects.count()}")
        print(f"   - Secteurs: {Sector.objects.count()}")
        print(f"   - Alertes: {Alert.objects.count()}")
        print(f"   - Rapports: {GovernmentReport.objects.count()}")
        print(f"   - Logs: {ActivityLog.objects.count()}")
        print("\n🎯 Prêt pour les tests !\n")
        
    except Exception as e:
        print(f"\n❌ ERREUR: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()
