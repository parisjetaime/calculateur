"""
Moteur de calcul reproduisant exactement les formules Excel
"""
from typing import Dict, Any, Optional
from datetime import datetime


def calculate_duration_days(start_date: Optional[str], end_date: Optional[str]) -> int:
    """
    Formule: =SI.CONDITIONS(ESTVIDE(D5)=VRAI;0;ESTVIDE(D6=VRAI);0;D5=D6;1;D5<>D6; D6-D5+1)
    Calcule la durée en jours entre deux dates
    """
    if not start_date or not end_date:
        return 0
    
    try:
        start = datetime.fromisoformat(start_date.replace('/', '-'))
        end = datetime.fromisoformat(end_date.replace('/', '-'))
        
        if start == end:
            return 1
        else:
            return (end - start).days + 1
    except:
        return 0


def calculate_visitors_foreign(
    event_type: str,
    total_visitors: int,
    visitors_foreign_pct: float,
    unknown_foreign_rate: bool,
    event_subtype: Optional[str],
    hypotheses: Dict[str, Any]
) -> int:
    """
    Formule: =SIERREUR(SI(C4="Evenement_professionnel";SI.CONDITIONS(C10=VRAI;C7*RECHERCHEV(E4;'Paramètres et hypothèses'!A17:M26;3;FAUX);C10=FAUX;C7*C8);C7*C8);0)
    
    Si événement professionnel ET taux inconnu: utiliser valeur de lookup
    Sinon: utiliser le pourcentage saisi
    """
    try:
        if event_type == "Evenement_professionnel" and unknown_foreign_rate and event_subtype:
            # RECHERCHEV dans les données OTCP événements professionnels
            # Colonne 3 = % visiteurs étrangers
            otcp_data = hypotheses.get('general', {}).get('otcp_data', {})
            foreign_pct = otcp_data.get(event_subtype, {}).get('pct_visiteurs_etrangers', 0.5)
            return int(total_visitors * foreign_pct)
        else:
            return int(total_visitors * (visitors_foreign_pct / 100))
    except:
        return 0


def calculate_visitors_national_non_idf(
    total_visitors: int,
    calculated_foreign: int,
    calculated_idf: int
) -> int:
    """
    Formule: =C7-H7-H5
    Nombre de visiteurs nationaux = Total - Etrangers - Franciliens
    """
    return total_visitors - calculated_idf - calculated_foreign


def calculate_visitors_idf(
    event_type: str,
    total_visitors: int,
    visitors_idf_pct: float,
    unknown_idf_rate: bool,
    event_subtype: Optional[str],
    hypotheses: Dict[str, Any]
) -> int:
    """
    Formule: =SIERREUR(SI(C4="Evenement_professionnel";SI.CONDITIONS(C11=VRAI;RECHERCHEV(E4;'Paramètres et hypothèses'!A17:M26;5;FAUX);C11=FAUX;C9)*C7;C7*C9);0)
    """
    try:
        if event_type == "Evenement_professionnel":
            if unknown_idf_rate and event_subtype:
                # RECHERCHEV colonne 5 = % visiteurs IDF
                otcp_data = hypotheses.get('general', {}).get('otcp_data', {})
                idf_pct = otcp_data.get(event_subtype, {}).get('pct_visiteurs_idf', 0.12)
                return int(total_visitors * idf_pct)
            else:
                return int(total_visitors * (visitors_idf_pct / 100))
        else:
            return int(total_visitors * (visitors_idf_pct / 100))
    except:
        return 0


def calculate_exhibitors_foreign(
    event_type: str,
    event_subtype: Optional[str],
    exhibiting_organizations: int,
    organizations_foreign_pct: float,
    unknown_organizations_foreign_rate: bool,
    athletes_artists_count: int,
    athletes_artists_foreign_pct: float,
    hypotheses: Dict[str, Any]
) -> int:
    """
    Formule: =SIERREUR(SI.CONDITIONS(C4="Evenement_professionnel";SI.CONDITIONS(C16=VRAI;RECHERCHEV(E4;'Paramètres et hypothèses'!A17:M26;8;FAUX);C16=FAUX;C14)*C13*'Paramètres et hypothèses'!B30;OU(C4="Evenement_culturel";C4="Evenement_sportif");E13*E14);0)
    """
    try:
        if event_type == "Evenement_professionnel":
            if unknown_organizations_foreign_rate and event_subtype:
                # RECHERCHEV colonne 8 = % entreprises étrangères
                otcp_data = hypotheses.get('general', {}).get('otcp_data', {})
                org_foreign_pct = otcp_data.get(event_subtype, {}).get('pct_entreprises_etrangeres', 0.5)
            else:
                org_foreign_pct = organizations_foreign_pct / 100
            
            # B30 = Nombre de personnes par entreprise exposante
            persons_per_org = hypotheses.get('general', {}).get('persons_per_exhibiting_org', 2.4)
            return int(exhibiting_organizations * org_foreign_pct * persons_per_org)
        
        elif event_type in ["Evenement_culturel", "Evenement_sportif"]:
            return int(athletes_artists_count * (athletes_artists_foreign_pct / 100))
        
        return 0
    except:
        return 0


def calculate_exhibitors_national_non_idf(
    event_type: str,
    event_subtype: Optional[str],
    exhibiting_organizations: int,
    organizations_foreign_pct: float,
    organizations_idf_pct: float,
    unknown_organizations_foreign_rate: bool,
    unknown_organizations_idf_rate: bool,
    athletes_artists_count: int,
    athletes_artists_foreign_pct: float,
    athletes_artists_idf_pct: float,
    hypotheses: Dict[str, Any]
) -> int:
    """
    Formule complexe: =SIERREUR(SI.CONDITIONS(C4="Evenement_professionnel";(100%-SI.CONDITIONS(C16=VRAI;RECHERCHEV(E4;'Paramètres et hypothèses'!A17:M26;8;FAUX);C16=FAUX;'Données & calculs'!C14)-SI.CONDITIONS(C17=VRAI;RECHERCHEV('Données & calculs'!E4;'Paramètres et hypothèses'!A17:M26;10;FAUX);C17=FAUX;C15))*'Données & calculs'!C13*'Paramètres et hypothèses'!B29;OU(C4="Evenement_culturel";C4="Evenement_sportif");E13*(100%-E14-E15));0)
    """
    try:
        if event_type == "Evenement_professionnel":
            # Calculer % étranger
            if unknown_organizations_foreign_rate and event_subtype:
                otcp_data = hypotheses.get('general', {}).get('otcp_data', {})
                org_foreign_pct = otcp_data.get(event_subtype, {}).get('pct_entreprises_etrangeres', 0.5) * 100
            else:
                org_foreign_pct = organizations_foreign_pct
            
            # Calculer % IDF
            if unknown_organizations_idf_rate and event_subtype:
                otcp_data = hypotheses.get('general', {}).get('otcp_data', {})
                org_idf_pct = otcp_data.get(event_subtype, {}).get('pct_entreprises_idf', 0.12) * 100
            else:
                org_idf_pct = organizations_idf_pct
            
            # % national = 100% - % étranger - % IDF
            org_national_pct = (100 - org_foreign_pct - org_idf_pct) / 100
            
            # B29 = Nombre de personnes par entreprise (nationale)
            persons_per_org = hypotheses.get('general', {}).get('persons_per_exhibiting_org_national', 2.4)
            return int(exhibiting_organizations * org_national_pct * persons_per_org)
        
        elif event_type in ["Evenement_culturel", "Evenement_sportif"]:
            nat_pct = (100 - athletes_artists_foreign_pct - athletes_artists_idf_pct) / 100
            return int(athletes_artists_count * nat_pct)
        
        return 0
    except:
        return 0


def calculate_exhibitors_idf(
    event_type: str,
    event_subtype: Optional[str],
    exhibiting_organizations: int,
    organizations_idf_pct: float,
    unknown_organizations_idf_rate: bool,
    athletes_artists_count: int,
    athletes_artists_idf_pct: float,
    hypotheses: Dict[str, Any]
) -> int:
    """
    Formule: =SIERREUR(SI.CONDITIONS(C4="Evenement_professionnel";SI.CONDITIONS(C17=VRAI;C13*RECHERCHEV(E4;'Paramètres et hypothèses'!A17:M26;10;FAUX)*'Paramètres et hypothèses'!B29;C17=FAUX;C13*C15*'Paramètres et hypothèses'!B29);OU(C4="Evenement_culturel";C4="Evenement_sportif");E13*E15);0)
    """
    try:
        if event_type == "Evenement_professionnel":
            if unknown_organizations_idf_rate and event_subtype:
                # RECHERCHEV colonne 10 = % entreprises IDF
                otcp_data = hypotheses.get('general', {}).get('otcp_data', {})
                org_idf_pct = otcp_data.get(event_subtype, {}).get('pct_entreprises_idf', 0.12)
            else:
                org_idf_pct = organizations_idf_pct / 100
            
            # B29 = Nombre de personnes par entreprise
            persons_per_org = hypotheses.get('general', {}).get('persons_per_exhibiting_org_national', 2.4)
            return int(exhibiting_organizations * org_idf_pct * persons_per_org)
        
        elif event_type in ["Evenement_culturel", "Evenement_sportif"]:
            return int(athletes_artists_count * (athletes_artists_idf_pct / 100))
        
        return 0
    except:
        return 0


class CalculationEngine:
    """Moteur de calcul principal"""
    
    def __init__(self, hypotheses: Dict[str, Any]):
        self.hypotheses = hypotheses
    
    def calculate_general_fields(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Calcule tous les champs du module Général"""
        
        # Durée de l'événement
        data['calculated_duration_days'] = calculate_duration_days(
            data.get('start_date'),
            data.get('end_date')
        )
        
        # Visiteurs étrangers
        data['calculated_visitors_foreign'] = calculate_visitors_foreign(
            data.get('event_type', ''),
            data.get('total_visitors', 0),
            data.get('visitors_foreign_pct', 0),
            data.get('unknown_foreign_rate', False),
            data.get('event_subtype'),
            self.hypotheses
        )
        
        # Visiteurs franciliens
        data['calculated_visitors_idf'] = calculate_visitors_idf(
            data.get('event_type', ''),
            data.get('total_visitors', 0),
            data.get('visitors_idf_pct', 0),
            data.get('unknown_idf_rate', False),
            data.get('event_subtype'),
            self.hypotheses
        )
        
        # Visiteurs nationaux non IDF (formule: =C7-H7-H5)
        data['calculated_visitors_national_non_idf'] = calculate_visitors_national_non_idf(
            data.get('total_visitors', 0),
            data['calculated_visitors_foreign'],
            data['calculated_visitors_idf']
        )
        
        # Exposants étrangers
        data['calculated_exhibitors_foreign'] = calculate_exhibitors_foreign(
            data.get('event_type', ''),
            data.get('event_subtype'),
            data.get('exhibiting_organizations', 0),
            data.get('organizations_foreign_pct', 0),
            data.get('unknown_organizations_foreign_rate', False),
            data.get('athletes_artists_count', 0),
            data.get('athletes_artists_foreign_pct', 0),
            self.hypotheses
        )
        
        # Exposants nationaux non IDF
        data['calculated_exhibitors_national'] = calculate_exhibitors_national_non_idf(
            data.get('event_type', ''),
            data.get('event_subtype'),
            data.get('exhibiting_organizations', 0),
            data.get('organizations_foreign_pct', 0),
            data.get('organizations_idf_pct', 0),
            data.get('unknown_organizations_foreign_rate', False),
            data.get('unknown_organizations_idf_rate', False),
            data.get('athletes_artists_count', 0),
            data.get('athletes_artists_foreign_pct', 0),
            data.get('athletes_artists_idf_pct', 0),
            self.hypotheses
        )
        
        # Exposants franciliens
        data['calculated_exhibitors_idf'] = calculate_exhibitors_idf(
            data.get('event_type', ''),
            data.get('event_subtype'),
            data.get('exhibiting_organizations', 0),
            data.get('organizations_idf_pct', 0),
            data.get('unknown_organizations_idf_rate', False),
            data.get('athletes_artists_count', 0),
            data.get('athletes_artists_idf_pct', 0),
            self.hypotheses
        )
        
        # Total exposants (Formule: =SOMME(H8:H10))
        data['calculated_total_exhibitors'] = (
            data['calculated_exhibitors_foreign'] +
            data['calculated_exhibitors_national'] +
            data['calculated_exhibitors_idf']
        )
        
        # Nombre total d'étrangers et DOM-TOM (Formule: =SIERREUR(H8+H5;0))
        data['calculated_total_foreign'] = (
            data['calculated_exhibitors_foreign'] +
            data['calculated_visitors_foreign']
        )
        
        # Nombre total de nationaux non IDF (Formule: =SIERREUR(H6+H9;0))
        data['calculated_total_national'] = (
            data['calculated_visitors_national_non_idf'] +
            data['calculated_exhibitors_national']
        )
        
        # Nombre total de franciliens (Formule: =SIERREUR(+H7+H10;0))
        data['calculated_total_idf'] = (
            data['calculated_visitors_idf'] +
            data['calculated_exhibitors_idf']
        )
        
        return data
