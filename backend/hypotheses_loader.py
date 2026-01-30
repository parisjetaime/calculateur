"""
Module pour charger les hypothèses depuis les fichiers JSON
"""
import json
import os
from pathlib import Path

HYPOTHESES_DIR = Path(__file__).parent / "hypotheses"

def load_json(filepath):
    """Charger un fichier JSON"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def load_all_hypotheses():
    """Charger toutes les hypothèses depuis les fichiers JSON"""
    hypotheses = {}
    
    # Énergie
    hypotheses['energie'] = {
        'combustibles': load_json(HYPOTHESES_DIR / 'energie' / 'combustibles.json')['data'],
        'facteurs_ceren': load_json(HYPOTHESES_DIR / 'energie' / 'facteurs_ceren.json')['data'],
        'chauffage_climatisation': load_json(HYPOTHESES_DIR / 'energie' / 'chauffage_climatisation.json')['data'],
    }
    
    # Transport
    hypotheses['transport'] = {
        'organisateurs_facteurs': load_json(HYPOTHESES_DIR / 'transport' / 'organisateurs_facteurs.json')['data'],
        'ratios_moyens': load_json(HYPOTHESES_DIR / 'transport' / 'ratios_moyens.json')['data'],
    }
    
    # Restauration
    hypotheses['restauration'] = {
        'regimes': load_json(HYPOTHESES_DIR / 'restauration' / 'regimes.json')['data'],
        'petit_dej_collation': load_json(HYPOTHESES_DIR / 'restauration' / 'petit_dej_collation.json')['data'],
        'boissons': load_json(HYPOTHESES_DIR / 'restauration' / 'boissons.json')['data'],
        'vaisselle_facteurs': load_json(HYPOTHESES_DIR / 'restauration' / 'vaisselle_facteurs_emissions.json')['data'],
        'ratio_monetaire': load_json(HYPOTHESES_DIR / 'restauration' / 'ratio_monetaire.json')['data'],
    }
    
    # Hébergements
    hypotheses['hebergements'] = {
        'facteurs_emissions': load_json(HYPOTHESES_DIR / 'hebergements' / 'facteurs_emissions.json')['data'],
        'nuitees_internationaux': load_json(HYPOTHESES_DIR / 'hebergements' / 'nuitees_internationaux.json')['data'],
        'nuitees_nationaux': load_json(HYPOTHESES_DIR / 'hebergements' / 'nuitees_nationaux.json')['data'],
    }
    
    # Communication
    hypotheses['communication'] = {
        'supports_physiques': load_json(HYPOTHESES_DIR / 'communication' / 'supports_physiques.json')['data'],
        'supports_numeriques': load_json(HYPOTHESES_DIR / 'communication' / 'supports_numeriques.json')['data'],
        'ratio_monetaire': load_json(HYPOTHESES_DIR / 'communication' / 'ratio_monetaire.json')['data'],
    }
    
    # Achats/Goodies
    hypotheses['achats_goodies'] = {
        'badges_intensite': load_json(HYPOTHESES_DIR / 'achats_goodies' / 'badges_intensite.json')['data'],
        'ratio_categorie': load_json(HYPOTHESES_DIR / 'achats_goodies' / 'ratio_categorie.json')['data'],
    }
    
    # Fret
    hypotheses['fret'] = {
        'ratio_monetaire': load_json(HYPOTHESES_DIR / 'fret' / 'ratio_monetaire.json')['data'],
        'vehicules': load_json(HYPOTHESES_DIR / 'fret' / 'vehicules.json')['data'],
    }
    
    # Aménagements
    hypotheses['amenagements'] = {
        'ratio_monetaire': load_json(HYPOTHESES_DIR / 'amenagements_accueil' / 'ratio_monetaire.json')['data'],
    }
    
    return hypotheses

def get_emission_factors():
    """Obtenir les facteurs d'émission formatés pour le backend"""
    hyp = load_all_hypotheses()
    
    return {
        "energy": {
            "gas_kwh": hyp['energie']['combustibles']['Gaz']['emissions'],
            "fuel_liter": hyp['energie']['combustibles']['Fioul']['emissions'],
            "electricity_kwh": hyp['energie']['combustibles']['Electricité']['emissions'],
            "coal_kg": hyp['energie']['combustibles']['Charbon']['emissions'],
        },
        "building_estimation": {
            cat_id: {
                "heating": data['chauffage'],
                "electricity": data['electricite_specifique'],
                "cooling": data['climatisation'],
            }
            for cat_id, data in hyp['energie']['facteurs_ceren']['valeurs'].items()
        },
        "transport": {
            "car_average": hyp['transport']['organisateurs_facteurs']['valeurs']['Voiture (moyenne)'],
            "tgv": hyp['transport']['organisateurs_facteurs']['valeurs']['TGV'],
            "train_average": hyp['transport']['organisateurs_facteurs']['valeurs']['Train grande ligne'],
            "rer": hyp['transport']['organisateurs_facteurs']['valeurs']['RER ou transilien'],
            "bus": hyp['transport']['organisateurs_facteurs']['valeurs']['Autobus moyen'],
            "metro": hyp['transport']['organisateurs_facteurs']['valeurs']['Métro- IDF'],
            "plane_short_haul": hyp['transport']['organisateurs_facteurs']['valeurs']['Avion (court courrier)'],
            "plane_medium_haul": hyp['transport']['organisateurs_facteurs']['valeurs']['Avion (moyen courrier)'],
            "plane_long_haul": hyp['transport']['organisateurs_facteurs']['valeurs']['Avion (long courrier)'],
        },
        "catering": {
            regime['id']: regime['facteur_emissions'] 
            for regime in hyp['restauration']['regimes']
        },
        "accommodation": {
            hotel['id']: hotel['valeur']
            for hotel in hyp['hebergements']['facteurs_emissions']
        },
        "communication": {
            support['id']: support['empreinte_kgco2e']
            for support in hyp['communication']['supports_physiques']
        },
        "purchases": {
            'badges': {
                badge['type'].lower().replace(' ', '_'): badge['intensite_kgco2e_badge']
                for badge in hyp['achats_goodies']['badges_intensite']
            },
            'goodies': {
                cat['id']: cat['valeur']
                for cat in hyp['achats_goodies']['ratio_categorie']
            }
        },
    }
