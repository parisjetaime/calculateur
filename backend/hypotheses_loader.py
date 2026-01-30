"""
Module pour charger les hypothèses depuis les fichiers JSON
"""
import json
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
        'vaisselle_facteurs': load_json(HYPOTHESES_DIR / 'restauration' / 'vaisselle_facteurs_emissions.json')['data'],
        'ratio_monetaire': load_json(HYPOTHESES_DIR / 'restauration' / 'ratio_monetaire.json')['data'],
    }
    
    # Hébergements
    hypotheses['hebergements'] = {
        'facteurs_emissions': load_json(HYPOTHESES_DIR / 'hebergements' / 'facteurs_emissions.json')['data'],
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
        'approche_distances': load_json(HYPOTHESES_DIR / 'fret' / 'approche_par_les_distances.json')['data'],
        'approche_depenses': load_json(HYPOTHESES_DIR / 'fret' / 'approche_par_les_depenses.json')['data'],
    }
    
    # Aménagements
    hypotheses['amenagements'] = {
        'ratio_monetaire': load_json(HYPOTHESES_DIR / 'amenagements_accueil' / 'ratio_monetaire.json')['data'],
    }
    
    return hypotheses

def get_emission_factors():
    """Obtenir les facteurs d'émission formatés pour le backend"""
    try:
        hyp = load_all_hypotheses()
        
        # Helper pour créer dict des badges
        badges_dict = {}
        for badge in hyp['achats_goodies']['badges_intensite']:
            key = badge['id']
            badges_dict[key] = badge['intensite_carbone']
        
        # Helper pour créer dict des hébergements
        accommodation_dict = {}
        for hotel in hyp['hebergements']['facteurs_emissions']:
            accommodation_dict[hotel['id']] = hotel['valeur']
        
        # Helper pour créer dict des régimes
        catering_dict = {}
        for regime in hyp['restauration']['regimes']:
            catering_dict[regime['id']] = regime['facteur_emissions']
        
        # Communication ratio - utiliser la première valeur (général)
        comm_ratio = 170.0  # kgCO2/k€ - Communication général par défaut
        if hyp['communication']['ratio_monetaire'] and len(hyp['communication']['ratio_monetaire']) > 0:
            comm_ratio = hyp['communication']['ratio_monetaire'][0]['valeur']
        
        # Helper pour ratio goodies
        goodies_dict = {}
        for cat in hyp['achats_goodies']['ratio_categorie']:
            goodies_dict[cat['id']] = cat['valeur']
        
        # Helper pour ratios aménagements
        amenities_dict = {}
        for item in hyp['amenagements']['ratio_monetaire']:
            amenities_dict[item['id']] = item['valeur']
        
        # Helper pour fret
        fret_distances_dict = {}
        for vehicle in hyp['fret']['approche_distances']:
            fret_distances_dict[vehicle['id']] = vehicle['kgco2_t_km']
        
        fret_depenses_dict = {}
        for mode in hyp['fret']['approche_depenses']:
            fret_depenses_dict[mode['id']] = mode['valeur']
        
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
                "local_transport_euro_ratio": hyp['transport']['ratios_moyens']['valeurs']['Internationaux Ratio monétaire moyen calculé'] / 1000,  # kgCO2e/€
            },
            "catering": catering_dict,
            "accommodation": accommodation_dict,
            "communication": comm_dict,
            "communication_ratio": hyp['communication']['ratio_monetaire'][0]['valeur'] if hyp['communication']['ratio_monetaire'] else 0.653,
            "purchases": {
                'badges': badges_dict,
                'goodies': goodies_dict,
            },
            "freight": {
                'distances': fret_distances_dict,
                'depenses': fret_depenses_dict,
            },
            "amenities": amenities_dict,
        }
    except Exception as e:
        print(f"Erreur lors du chargement des hypothèses: {e}")
        # Retourner des valeurs par défaut en cas d'erreur
        return {}
