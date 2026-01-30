from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone

# Import des hypothèses
try:
    from hypotheses_loader import get_emission_factors
    EMISSION_FACTORS = get_emission_factors()
    print("✓ Hypothèses chargées depuis les fichiers JSON")
except Exception as e:
    print(f"⚠ Erreur lors du chargement des hypothèses: {e}")
    print("Utilisation des facteurs par défaut")
    EMISSION_FACTORS = {}


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ==================== MODELS ====================

class EventGeneral(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_name: str
    event_type: str
    event_duration_days: int
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    total_visitors: int
    visitors_foreign: int
    visitors_national_non_idf: int
    visitors_idf: int
    total_exhibitors: int
    exhibitors_foreign: int
    exhibitors_national_non_idf: int
    exhibitors_idf: int
    organizers_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EventGeneralCreate(BaseModel):
    event_name: str
    event_type: str
    event_duration_days: int
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    total_visitors: int
    visitors_foreign: int
    visitors_national_non_idf: int
    visitors_idf: int
    total_exhibitors: int
    exhibitors_foreign: int
    exhibitors_national_non_idf: int
    exhibitors_idf: int
    organizers_count: int = 0

class EnergyData(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    approach: str  # "real" or "estimated"
    
    # Real consumption
    gas_kwh: float = 0
    fuel_liters: float = 0
    electricity_kwh: float = 0
    coal_kg: float = 0
    
    # Estimated consumption
    building_type: Optional[str] = None
    surface_m2: Optional[float] = None
    
    # Generators
    has_generators: bool = False
    generators_fuel_liters: float = 0
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EnergyDataCreate(BaseModel):
    event_id: str
    approach: str
    gas_kwh: float = 0
    fuel_liters: float = 0
    electricity_kwh: float = 0
    coal_kg: float = 0
    building_type: Optional[str] = None
    surface_m2: Optional[float] = None
    has_generators: bool = False
    generators_fuel_liters: float = 0

class TransportData(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    
    # Visitors transport
    visitors_avg_distance_foreign_km: float = 0
    visitors_avg_distance_national_km: float = 0
    visitors_local_transport_expenses: float = 0
    
    # Exhibitors transport
    exhibitors_avg_distance_foreign_km: float = 0
    exhibitors_avg_distance_national_km: float = 0
    exhibitors_local_transport_expenses: float = 0
    
    # Organizers transport
    organizers_avg_distance_km: float = 0
    organizers_round_trips: int = 0
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TransportDataCreate(BaseModel):
    event_id: str
    visitors_avg_distance_foreign_km: float = 0
    visitors_avg_distance_national_km: float = 0
    visitors_local_transport_expenses: float = 0
    exhibitors_avg_distance_foreign_km: float = 0
    exhibitors_avg_distance_national_km: float = 0
    exhibitors_local_transport_expenses: float = 0
    organizers_avg_distance_km: float = 0
    organizers_round_trips: int = 0

class CateringData(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    
    # Meals
    breakfasts_count: int = 0
    lunches_count: int = 0
    dinners_count: int = 0
    snacks_count: int = 0
    
    # Meal types
    meals_meat_heavy_pct: float = 50
    meals_balanced_pct: float = 30
    meals_vegetarian_pct: float = 20
    
    # Dishes
    dishes_type: str = "disposable"  # "disposable" or "reusable"
    
    # Beverages
    water_liters: float = 0
    coffee_units: int = 0
    soft_drinks_units: int = 0
    alcohol_units: int = 0
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CateringDataCreate(BaseModel):
    event_id: str
    breakfasts_count: int = 0
    lunches_count: int = 0
    dinners_count: int = 0
    snacks_count: int = 0
    meals_meat_heavy_pct: float = 50
    meals_balanced_pct: float = 30
    meals_vegetarian_pct: float = 20
    dishes_type: str = "disposable"
    water_liters: float = 0
    coffee_units: int = 0
    soft_drinks_units: int = 0
    alcohol_units: int = 0

class AccommodationData(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    
    # Foreign visitors
    foreign_hotel_5star_pct: float = 0
    foreign_hotel_3star_pct: float = 0
    foreign_hotel_1star_pct: float = 0
    foreign_other_accommodation_pct: float = 0
    foreign_family_pct: float = 0
    foreign_avg_nights: float = 0
    
    # National non-IDF visitors
    national_hotel_5star_pct: float = 0
    national_hotel_3star_pct: float = 0
    national_hotel_1star_pct: float = 0
    national_other_accommodation_pct: float = 0
    national_family_pct: float = 0
    national_avg_nights: float = 0
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AccommodationDataCreate(BaseModel):
    event_id: str
    foreign_hotel_5star_pct: float = 0
    foreign_hotel_3star_pct: float = 0
    foreign_hotel_1star_pct: float = 0
    foreign_other_accommodation_pct: float = 0
    foreign_family_pct: float = 0
    foreign_avg_nights: float = 0
    national_hotel_5star_pct: float = 0
    national_hotel_3star_pct: float = 0
    national_hotel_1star_pct: float = 0
    national_other_accommodation_pct: float = 0
    national_family_pct: float = 0
    national_avg_nights: float = 0

class WasteData(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    
    # Waste by type (kg)
    plastic_kg: float = 0
    cardboard_kg: float = 0
    paper_kg: float = 0
    aluminum_kg: float = 0
    textile_kg: float = 0
    furniture_kg: float = 0
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WasteDataCreate(BaseModel):
    event_id: str
    plastic_kg: float = 0
    cardboard_kg: float = 0
    paper_kg: float = 0
    aluminum_kg: float = 0
    textile_kg: float = 0
    furniture_kg: float = 0

class CommunicationData(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    
    # Physical supports
    posters_count: int = 0
    flyers_count: int = 0
    banners_count: int = 0
    
    # Digital supports
    streaming_hours: float = 0
    streaming_audience: int = 0
    
    # Expenses
    communication_expenses: float = 0
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CommunicationDataCreate(BaseModel):
    event_id: str
    posters_count: int = 0
    flyers_count: int = 0
    banners_count: int = 0
    streaming_hours: float = 0
    streaming_audience: int = 0
    communication_expenses: float = 0

class FreightData(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    
    # Freight by type
    decor_weight_kg: float = 0
    decor_distance_km: float = 0
    equipment_weight_kg: float = 0
    equipment_distance_km: float = 0
    food_weight_kg: float = 0
    food_distance_km: float = 0
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FreightDataCreate(BaseModel):
    event_id: str
    decor_weight_kg: float = 0
    decor_distance_km: float = 0
    equipment_weight_kg: float = 0
    equipment_distance_km: float = 0
    food_weight_kg: float = 0
    food_distance_km: float = 0

class AmenitiesData(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    
    # Expenses
    site_rental_expenses: float = 0
    reception_expenses: float = 0
    construction_expenses: float = 0
    it_expenses: float = 0
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AmenitiesDataCreate(BaseModel):
    event_id: str
    site_rental_expenses: float = 0
    reception_expenses: float = 0
    construction_expenses: float = 0
    it_expenses: float = 0

class PurchasesData(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    
    # Goodies
    goodies_expenses_per_person: float = 0
    
    # Badges
    badges_visitors: int = 0
    badges_exhibitors: int = 0
    badges_organizers: int = 0
    badges_type: str = "plastic_soft"  # "plastic_soft", "plastic_hard", "textile", "paper"
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PurchasesDataCreate(BaseModel):
    event_id: str
    goodies_expenses_per_person: float = 0
    badges_visitors: int = 0
    badges_exhibitors: int = 0
    badges_organizers: int = 0
    badges_type: str = "plastic_soft"

class Top3Emitter(BaseModel):
    category: str
    emissions: float

class EmissionResult(BaseModel):
    event_id: str
    event_name: str
    total_emissions_kg: float
    emissions_by_category: Dict[str, float]
    emissions_per_participant: float
    emission_class: str  # A, B, C, D, E, F, G
    top_3_emitters: List[Top3Emitter]


# ==================== EMISSION FACTORS ====================
# Les facteurs d'émission sont maintenant chargés depuis les fichiers JSON
# via EMISSION_FACTORS = get_emission_factors()


# ==================== CALCULATION ENGINE ====================

def calculate_energy_emissions(event: EventGeneral, energy: EnergyData) -> float:
    total = 0
    
    if energy.approach == "real":
        total += energy.gas_kwh * EMISSION_FACTORS["energy"]["gas_kwh"]
        total += energy.fuel_liters * EMISSION_FACTORS["energy"]["fuel_liter"]
        total += energy.electricity_kwh * EMISSION_FACTORS["energy"]["electricity_kwh"]
        total += energy.coal_kg * EMISSION_FACTORS["energy"]["coal_kg"]
    else:  # estimated
        if energy.building_type and energy.surface_m2:
            building_factors = EMISSION_FACTORS["building_estimation"].get(
                energy.building_type, EMISSION_FACTORS["building_estimation"]["offices"]
            )
            days_per_year = 365
            event_fraction = event.event_duration_days / days_per_year
            total += energy.surface_m2 * event_fraction * (
                building_factors["heating"] + building_factors["electricity"] + building_factors["cooling"]
            )
    
    if energy.has_generators:
        total += energy.generators_fuel_liters * EMISSION_FACTORS["energy"]["fuel_liter"]
    
    return total

def calculate_transport_emissions(event: EventGeneral, transport: TransportData) -> float:
    total = 0
    
    # Visitors foreign - assume plane for most
    if transport.visitors_avg_distance_foreign_km > 0:
        if transport.visitors_avg_distance_foreign_km > 3000:
            factor = EMISSION_FACTORS["transport"]["plane_long_haul"]
        elif transport.visitors_avg_distance_foreign_km > 1000:
            factor = EMISSION_FACTORS["transport"]["plane_medium_haul"]
        else:
            factor = EMISSION_FACTORS["transport"]["plane_short_haul"]
        total += event.visitors_foreign * transport.visitors_avg_distance_foreign_km * 2 * factor
    
    # Visitors national - assume car/train mix (70% car, 30% train)
    if transport.visitors_avg_distance_national_km > 0:
        car_factor = EMISSION_FACTORS["transport"]["car_average"] * 0.7
        train_factor = EMISSION_FACTORS["transport"]["train_average"] * 0.3
        total += event.visitors_national_non_idf * transport.visitors_avg_distance_national_km * 2 * (car_factor + train_factor)
    
    # Exhibitors foreign
    if transport.exhibitors_avg_distance_foreign_km > 0:
        if transport.exhibitors_avg_distance_foreign_km > 3000:
            factor = EMISSION_FACTORS["transport"]["plane_long_haul"]
        elif transport.exhibitors_avg_distance_foreign_km > 1000:
            factor = EMISSION_FACTORS["transport"]["plane_medium_haul"]
        else:
            factor = EMISSION_FACTORS["transport"]["plane_short_haul"]
        total += event.exhibitors_foreign * transport.exhibitors_avg_distance_foreign_km * 2 * factor
    
    # Exhibitors national
    if transport.exhibitors_avg_distance_national_km > 0:
        car_factor = EMISSION_FACTORS["transport"]["car_average"] * 0.7
        train_factor = EMISSION_FACTORS["transport"]["train_average"] * 0.3
        total += event.exhibitors_national_non_idf * transport.exhibitors_avg_distance_national_km * 2 * (car_factor + train_factor)
    
    # Organizers
    if transport.organizers_avg_distance_km > 0 and event.organizers_count > 0:
        car_factor = EMISSION_FACTORS["transport"]["car_average"]
        total += event.organizers_count * transport.organizers_avg_distance_km * transport.organizers_round_trips * car_factor
    
    # Local transport
    total += transport.visitors_local_transport_expenses * EMISSION_FACTORS["transport"]["local_transport_euro_ratio"]
    total += transport.exhibitors_local_transport_expenses * EMISSION_FACTORS["transport"]["local_transport_euro_ratio"]
    
    return total

def calculate_catering_emissions(event: EventGeneral, catering: CateringData) -> float:
    total = 0
    
    # Mapping des types de repas vers les IDs des hypothèses
    regime_mapping = {
        'meat_heavy': 'a_dominante_animale_avec_boeuf',
        'balanced': 'classique',
        'vegetarian': 'vegetarien',
    }
    
    # Petit-déjeuner et collation
    petit_dej_factor = EMISSION_FACTORS.get("catering", {}).get('petit_dejeuner_standard', 0.5139)
    collation_factor = EMISSION_FACTORS.get("catering", {}).get('collation_standard', 0.3)
    
    # Breakfasts
    total += catering.breakfasts_count * petit_dej_factor
    
    # Snacks
    total += catering.snacks_count * collation_factor
    
    # Lunches - utiliser les nouveaux facteurs d'émission
    meat_heavy_factor = EMISSION_FACTORS.get("catering", {}).get(regime_mapping['meat_heavy'], 7.26)
    balanced_factor = EMISSION_FACTORS.get("catering", {}).get(regime_mapping['balanced'], 3.49)
    vegetarian_factor = EMISSION_FACTORS.get("catering", {}).get(regime_mapping['vegetarian'], 1.5)
    
    meat_heavy_lunches = catering.lunches_count * (catering.meals_meat_heavy_pct / 100)
    balanced_lunches = catering.lunches_count * (catering.meals_balanced_pct / 100)
    vegetarian_lunches = catering.lunches_count * (catering.meals_vegetarian_pct / 100)
    
    total += meat_heavy_lunches * meat_heavy_factor
    total += balanced_lunches * balanced_factor
    total += vegetarian_lunches * vegetarian_factor
    
    # Dinners - mêmes facteurs que les déjeuners
    meat_heavy_dinners = catering.dinners_count * (catering.meals_meat_heavy_pct / 100)
    balanced_dinners = catering.dinners_count * (catering.meals_balanced_pct / 100)
    vegetarian_dinners = catering.dinners_count * (catering.meals_vegetarian_pct / 100)
    
    total += meat_heavy_dinners * meat_heavy_factor
    total += balanced_dinners * balanced_factor
    total += vegetarian_dinners * vegetarian_factor
    
    # Beverages - valeurs par défaut
    total += catering.water_liters * 0.0003
    total += catering.coffee_units * 0.0077
    total += catering.soft_drinks_units * 0.0033
    total += catering.alcohol_units * 1.59
    
    # Dishes - valeurs par défaut
    total_meals = catering.breakfasts_count + catering.lunches_count + catering.dinners_count
    if catering.dishes_type == "disposable":
        total += total_meals * 0.0004049
        total += catering.snacks_count * 0.000485
    else:
        total += (total_meals + catering.snacks_count) * 0.00005
    
    return total

def calculate_accommodation_emissions(event: EventGeneral, accommodation: AccommodationData) -> float:
    total = 0
    
    # Mapping des clés vers les IDs des hypothèses
    hotel_mapping = {
        'hotel_5star': 'hotel_5_etoiles',
        'hotel_3star': 'hotel_3_etoiles',
        'hotel_1star': 'hotel_sans_classement',  # ou hotel_2_etoiles selon le besoin
        'other_accommodation': 'autre_hebergement_marchand',
        'family': 'chez_la_famille_ou_des_amis',
    }
    
    # Foreign visitors
    if event.visitors_foreign > 0 and accommodation.foreign_avg_nights > 0:
        emissions = 0
        if accommodation.foreign_hotel_5star_pct > 0:
            factor = EMISSION_FACTORS.get("accommodation", {}).get(hotel_mapping['hotel_5star'], 17.11)
            emissions += event.visitors_foreign * accommodation.foreign_avg_nights * (accommodation.foreign_hotel_5star_pct / 100) * factor
        if accommodation.foreign_hotel_3star_pct > 0:
            factor = EMISSION_FACTORS.get("accommodation", {}).get(hotel_mapping['hotel_3star'], 8.47)
            emissions += event.visitors_foreign * accommodation.foreign_avg_nights * (accommodation.foreign_hotel_3star_pct / 100) * factor
        if accommodation.foreign_hotel_1star_pct > 0:
            factor = EMISSION_FACTORS.get("accommodation", {}).get(hotel_mapping['hotel_1star'], 4.73)
            emissions += event.visitors_foreign * accommodation.foreign_avg_nights * (accommodation.foreign_hotel_1star_pct / 100) * factor
        if accommodation.foreign_other_accommodation_pct > 0:
            factor = EMISSION_FACTORS.get("accommodation", {}).get(hotel_mapping['other_accommodation'], 10.04)
            emissions += event.visitors_foreign * accommodation.foreign_avg_nights * (accommodation.foreign_other_accommodation_pct / 100) * factor
        total += emissions
    
    # National non-IDF visitors
    if event.visitors_national_non_idf > 0 and accommodation.national_avg_nights > 0:
        emissions = 0
        if accommodation.national_hotel_5star_pct > 0:
            factor = EMISSION_FACTORS.get("accommodation", {}).get(hotel_mapping['hotel_5star'], 17.11)
            emissions += event.visitors_national_non_idf * accommodation.national_avg_nights * (accommodation.national_hotel_5star_pct / 100) * factor
        if accommodation.national_hotel_3star_pct > 0:
            factor = EMISSION_FACTORS.get("accommodation", {}).get(hotel_mapping['hotel_3star'], 8.47)
            emissions += event.visitors_national_non_idf * accommodation.national_avg_nights * (accommodation.national_hotel_3star_pct / 100) * factor
        if accommodation.national_hotel_1star_pct > 0:
            factor = EMISSION_FACTORS.get("accommodation", {}).get(hotel_mapping['hotel_1star'], 4.73)
            emissions += event.visitors_national_non_idf * accommodation.national_avg_nights * (accommodation.national_hotel_1star_pct / 100) * factor
        if accommodation.national_other_accommodation_pct > 0:
            factor = EMISSION_FACTORS.get("accommodation", {}).get(hotel_mapping['other_accommodation'], 10.04)
            emissions += event.visitors_national_non_idf * accommodation.national_avg_nights * (accommodation.national_other_accommodation_pct / 100) * factor
        total += emissions
    
    return total

def calculate_waste_emissions(waste: WasteData) -> float:
    total = 0
    total += waste.plastic_kg * EMISSION_FACTORS["waste"]["plastic"]
    total += waste.cardboard_kg * EMISSION_FACTORS["waste"]["cardboard"]
    total += waste.paper_kg * EMISSION_FACTORS["waste"]["paper"]
    total += waste.aluminum_kg * EMISSION_FACTORS["waste"]["aluminum"]
    total += waste.textile_kg * EMISSION_FACTORS["waste"]["textile"]
    total += waste.furniture_kg * EMISSION_FACTORS["waste"]["furniture"]
    return total

def calculate_communication_emissions(communication: CommunicationData) -> float:
    total = 0
    total += communication.posters_count * EMISSION_FACTORS["communication"]["poster_4m2"]
    total += communication.flyers_count * EMISSION_FACTORS["communication"]["flyer"]
    total += communication.banners_count * EMISSION_FACTORS["communication"]["banner"]
    
    if communication.streaming_hours > 0 and communication.streaming_audience > 0:
        total += (communication.streaming_hours * communication.streaming_audience / 1000 * 
                 EMISSION_FACTORS["communication"]["streaming_hour"])
    
    total += communication.communication_expenses * EMISSION_FACTORS["communication"]["communication_euro_ratio"]
    
    return total

def calculate_freight_emissions(freight: FreightData) -> float:
    total = 0
    # Assuming truck transport
    factor = EMISSION_FACTORS["freight"]["truck_tkm"]
    
    if freight.decor_weight_kg > 0:
        total += (freight.decor_weight_kg / 1000) * freight.decor_distance_km * factor
    if freight.equipment_weight_kg > 0:
        total += (freight.equipment_weight_kg / 1000) * freight.equipment_distance_km * factor
    if freight.food_weight_kg > 0:
        total += (freight.food_weight_kg / 1000) * freight.food_distance_km * factor
    
    return total

def calculate_amenities_emissions(amenities: AmenitiesData) -> float:
    total = 0
    total += amenities.site_rental_expenses * EMISSION_FACTORS["amenities"]["site_rental_euro_ratio"]
    total += amenities.reception_expenses * EMISSION_FACTORS["amenities"]["reception_euro_ratio"]
    total += amenities.construction_expenses * EMISSION_FACTORS["amenities"]["construction_euro_ratio"]
    total += amenities.it_expenses * EMISSION_FACTORS["amenities"]["it_euro_ratio"]
    return total

def calculate_purchases_emissions(event: EventGeneral, purchases: PurchasesData) -> float:
    total = 0
    
    # Goodies - utiliser le ratio de la catégorie appropriée
    total_people = event.total_visitors + event.total_exhibitors
    goodies_ratio = EMISSION_FACTORS.get("purchases", {}).get("goodies", {}).get("fournitures_de_bureau_legeres", 5.92)
    total += total_people * purchases.goodies_expenses_per_person * goodies_ratio
    
    # Badges - nouveau mapping
    badge_mapping = {
        "plastic_soft": "plastique_souple",
        "plastic_hard": "plastique_rigide",
        "textile": "textile",
        "paper": "papier",
    }
    
    badge_factor = EMISSION_FACTORS.get("purchases", {}).get("badges", {}).get(
        badge_mapping.get(purchases.badges_type, "plastique_souple"), 
        0.130419
    )
    total += (purchases.badges_visitors + purchases.badges_exhibitors + purchases.badges_organizers) * badge_factor
    
    return total

def get_emission_class(emissions_per_participant: float) -> str:
    """Classify emissions per participant (kgCO2e/person)"""
    if emissions_per_participant < 30:
        return "A"
    elif emissions_per_participant < 50:
        return "B"
    elif emissions_per_participant < 100:
        return "C"
    elif emissions_per_participant < 200:
        return "D"
    elif emissions_per_participant < 400:
        return "E"
    elif emissions_per_participant < 600:
        return "F"
    else:
        return "G"


# ==================== ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "Éco-Calculateur API"}

# Event General
@api_router.post("/events", response_model=EventGeneral)
async def create_event(input: EventGeneralCreate):
    event_dict = input.model_dump()
    event_obj = EventGeneral(**event_dict)
    
    doc = event_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.events.insert_one(doc)
    return event_obj

@api_router.get("/events", response_model=List[EventGeneral])
async def get_events():
    events = await db.events.find({}, {"_id": 0}).to_list(1000)
    for event in events:
        if isinstance(event['created_at'], str):
            event['created_at'] = datetime.fromisoformat(event['created_at'])
        if isinstance(event['updated_at'], str):
            event['updated_at'] = datetime.fromisoformat(event['updated_at'])
    return events

@api_router.get("/events/{event_id}", response_model=EventGeneral)
async def get_event(event_id: str):
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Événement non trouvé")
    if isinstance(event['created_at'], str):
        event['created_at'] = datetime.fromisoformat(event['created_at'])
    if isinstance(event['updated_at'], str):
        event['updated_at'] = datetime.fromisoformat(event['updated_at'])
    return event

# Energy
@api_router.post("/energy", response_model=EnergyData)
async def create_energy_data(input: EnergyDataCreate):
    energy_dict = input.model_dump()
    energy_obj = EnergyData(**energy_dict)
    doc = energy_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.energy.insert_one(doc)
    return energy_obj

@api_router.get("/energy/{event_id}", response_model=EnergyData)
async def get_energy_data(event_id: str):
    energy = await db.energy.find_one({"event_id": event_id}, {"_id": 0})
    if not energy:
        raise HTTPException(status_code=404, detail="Données énergie non trouvées")
    if isinstance(energy['created_at'], str):
        energy['created_at'] = datetime.fromisoformat(energy['created_at'])
    return energy

# Transport
@api_router.post("/transport", response_model=TransportData)
async def create_transport_data(input: TransportDataCreate):
    transport_dict = input.model_dump()
    transport_obj = TransportData(**transport_dict)
    doc = transport_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.transport.insert_one(doc)
    return transport_obj

@api_router.get("/transport/{event_id}", response_model=TransportData)
async def get_transport_data(event_id: str):
    transport = await db.transport.find_one({"event_id": event_id}, {"_id": 0})
    if not transport:
        raise HTTPException(status_code=404, detail="Données transport non trouvées")
    if isinstance(transport['created_at'], str):
        transport['created_at'] = datetime.fromisoformat(transport['created_at'])
    return transport

# Catering
@api_router.post("/catering", response_model=CateringData)
async def create_catering_data(input: CateringDataCreate):
    catering_dict = input.model_dump()
    catering_obj = CateringData(**catering_dict)
    doc = catering_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.catering.insert_one(doc)
    return catering_obj

@api_router.get("/catering/{event_id}", response_model=CateringData)
async def get_catering_data(event_id: str):
    catering = await db.catering.find_one({"event_id": event_id}, {"_id": 0})
    if not catering:
        raise HTTPException(status_code=404, detail="Données restauration non trouvées")
    if isinstance(catering['created_at'], str):
        catering['created_at'] = datetime.fromisoformat(catering['created_at'])
    return catering

# Accommodation
@api_router.post("/accommodation", response_model=AccommodationData)
async def create_accommodation_data(input: AccommodationDataCreate):
    accommodation_dict = input.model_dump()
    accommodation_obj = AccommodationData(**accommodation_dict)
    doc = accommodation_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.accommodation.insert_one(doc)
    return accommodation_obj

@api_router.get("/accommodation/{event_id}", response_model=AccommodationData)
async def get_accommodation_data(event_id: str):
    accommodation = await db.accommodation.find_one({"event_id": event_id}, {"_id": 0})
    if not accommodation:
        raise HTTPException(status_code=404, detail="Données hébergement non trouvées")
    if isinstance(accommodation['created_at'], str):
        accommodation['created_at'] = datetime.fromisoformat(accommodation['created_at'])
    return accommodation

# Waste
@api_router.post("/waste", response_model=WasteData)
async def create_waste_data(input: WasteDataCreate):
    waste_dict = input.model_dump()
    waste_obj = WasteData(**waste_dict)
    doc = waste_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.waste.insert_one(doc)
    return waste_obj

@api_router.get("/waste/{event_id}", response_model=WasteData)
async def get_waste_data(event_id: str):
    waste = await db.waste.find_one({"event_id": event_id}, {"_id": 0})
    if not waste:
        raise HTTPException(status_code=404, detail="Données déchets non trouvées")
    if isinstance(waste['created_at'], str):
        waste['created_at'] = datetime.fromisoformat(waste['created_at'])
    return waste

# Communication
@api_router.post("/communication", response_model=CommunicationData)
async def create_communication_data(input: CommunicationDataCreate):
    communication_dict = input.model_dump()
    communication_obj = CommunicationData(**communication_dict)
    doc = communication_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.communication.insert_one(doc)
    return communication_obj

@api_router.get("/communication/{event_id}", response_model=CommunicationData)
async def get_communication_data(event_id: str):
    communication = await db.communication.find_one({"event_id": event_id}, {"_id": 0})
    if not communication:
        raise HTTPException(status_code=404, detail="Données communication non trouvées")
    if isinstance(communication['created_at'], str):
        communication['created_at'] = datetime.fromisoformat(communication['created_at'])
    return communication

# Freight
@api_router.post("/freight", response_model=FreightData)
async def create_freight_data(input: FreightDataCreate):
    freight_dict = input.model_dump()
    freight_obj = FreightData(**freight_dict)
    doc = freight_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.freight.insert_one(doc)
    return freight_obj

@api_router.get("/freight/{event_id}", response_model=FreightData)
async def get_freight_data(event_id: str):
    freight = await db.freight.find_one({"event_id": event_id}, {"_id": 0})
    if not freight:
        raise HTTPException(status_code=404, detail="Données fret non trouvées")
    if isinstance(freight['created_at'], str):
        freight['created_at'] = datetime.fromisoformat(freight['created_at'])
    return freight

# Amenities
@api_router.post("/amenities", response_model=AmenitiesData)
async def create_amenities_data(input: AmenitiesDataCreate):
    amenities_dict = input.model_dump()
    amenities_obj = AmenitiesData(**amenities_dict)
    doc = amenities_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.amenities.insert_one(doc)
    return amenities_obj

@api_router.get("/amenities/{event_id}", response_model=AmenitiesData)
async def get_amenities_data(event_id: str):
    amenities = await db.amenities.find_one({"event_id": event_id}, {"_id": 0})
    if not amenities:
        raise HTTPException(status_code=404, detail="Données aménagements non trouvées")
    if isinstance(amenities['created_at'], str):
        amenities['created_at'] = datetime.fromisoformat(amenities['created_at'])
    return amenities

# Purchases
@api_router.post("/purchases", response_model=PurchasesData)
async def create_purchases_data(input: PurchasesDataCreate):
    purchases_dict = input.model_dump()
    purchases_obj = PurchasesData(**purchases_dict)
    doc = purchases_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.purchases.insert_one(doc)
    return purchases_obj

@api_router.get("/purchases/{event_id}", response_model=PurchasesData)
async def get_purchases_data(event_id: str):
    purchases = await db.purchases.find_one({"event_id": event_id}, {"_id": 0})
    if not purchases:
        raise HTTPException(status_code=404, detail="Données achats non trouvées")
    if isinstance(purchases['created_at'], str):
        purchases['created_at'] = datetime.fromisoformat(purchases['created_at'])
    return purchases

# Calculate emissions
@api_router.get("/calculate/{event_id}", response_model=EmissionResult)
async def calculate_emissions(event_id: str):
    # Get event data
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Événement non trouvé")
    
    if isinstance(event['created_at'], str):
        event['created_at'] = datetime.fromisoformat(event['created_at'])
    if isinstance(event['updated_at'], str):
        event['updated_at'] = datetime.fromisoformat(event['updated_at'])
    
    event_obj = EventGeneral(**event)
    
    emissions_by_category = {}
    
    # Energy
    energy = await db.energy.find_one({"event_id": event_id}, {"_id": 0})
    if energy:
        if isinstance(energy.get('created_at'), str):
            energy['created_at'] = datetime.fromisoformat(energy['created_at'])
        energy_obj = EnergyData(**energy)
        emissions_by_category["Énergie"] = calculate_energy_emissions(event_obj, energy_obj)
    else:
        emissions_by_category["Énergie"] = 0
    
    # Transport
    transport = await db.transport.find_one({"event_id": event_id}, {"_id": 0})
    if transport:
        if isinstance(transport.get('created_at'), str):
            transport['created_at'] = datetime.fromisoformat(transport['created_at'])
        transport_obj = TransportData(**transport)
        emissions_by_category["Transport"] = calculate_transport_emissions(event_obj, transport_obj)
    else:
        emissions_by_category["Transport"] = 0
    
    # Catering
    catering = await db.catering.find_one({"event_id": event_id}, {"_id": 0})
    if catering:
        if isinstance(catering.get('created_at'), str):
            catering['created_at'] = datetime.fromisoformat(catering['created_at'])
        catering_obj = CateringData(**catering)
        emissions_by_category["Restauration"] = calculate_catering_emissions(event_obj, catering_obj)
    else:
        emissions_by_category["Restauration"] = 0
    
    # Accommodation
    accommodation = await db.accommodation.find_one({"event_id": event_id}, {"_id": 0})
    if accommodation:
        if isinstance(accommodation.get('created_at'), str):
            accommodation['created_at'] = datetime.fromisoformat(accommodation['created_at'])
        accommodation_obj = AccommodationData(**accommodation)
        emissions_by_category["Hébergements"] = calculate_accommodation_emissions(event_obj, accommodation_obj)
    else:
        emissions_by_category["Hébergements"] = 0
    
    # Waste
    waste = await db.waste.find_one({"event_id": event_id}, {"_id": 0})
    if waste:
        if isinstance(waste.get('created_at'), str):
            waste['created_at'] = datetime.fromisoformat(waste['created_at'])
        waste_obj = WasteData(**waste)
        emissions_by_category["Déchets"] = calculate_waste_emissions(waste_obj)
    else:
        emissions_by_category["Déchets"] = 0
    
    # Communication
    communication = await db.communication.find_one({"event_id": event_id}, {"_id": 0})
    if communication:
        if isinstance(communication.get('created_at'), str):
            communication['created_at'] = datetime.fromisoformat(communication['created_at'])
        communication_obj = CommunicationData(**communication)
        emissions_by_category["Communication"] = calculate_communication_emissions(communication_obj)
    else:
        emissions_by_category["Communication"] = 0
    
    # Freight
    freight = await db.freight.find_one({"event_id": event_id}, {"_id": 0})
    if freight:
        if isinstance(freight.get('created_at'), str):
            freight['created_at'] = datetime.fromisoformat(freight['created_at'])
        freight_obj = FreightData(**freight)
        emissions_by_category["Fret"] = calculate_freight_emissions(freight_obj)
    else:
        emissions_by_category["Fret"] = 0
    
    # Amenities
    amenities = await db.amenities.find_one({"event_id": event_id}, {"_id": 0})
    if amenities:
        if isinstance(amenities.get('created_at'), str):
            amenities['created_at'] = datetime.fromisoformat(amenities['created_at'])
        amenities_obj = AmenitiesData(**amenities)
        emissions_by_category["Aménagements"] = calculate_amenities_emissions(amenities_obj)
    else:
        emissions_by_category["Aménagements"] = 0
    
    # Purchases
    purchases = await db.purchases.find_one({"event_id": event_id}, {"_id": 0})
    if purchases:
        if isinstance(purchases.get('created_at'), str):
            purchases['created_at'] = datetime.fromisoformat(purchases['created_at'])
        purchases_obj = PurchasesData(**purchases)
        emissions_by_category["Achats et goodies"] = calculate_purchases_emissions(event_obj, purchases_obj)
    else:
        emissions_by_category["Achats et goodies"] = 0
    
    # Calculate totals
    total_emissions_kg = sum(emissions_by_category.values())
    total_participants = event_obj.total_visitors + event_obj.total_exhibitors + event_obj.organizers_count
    emissions_per_participant = total_emissions_kg / total_participants if total_participants > 0 else 0
    emission_class = get_emission_class(emissions_per_participant)
    
    # Get top 3 emitters
    sorted_emissions = sorted(emissions_by_category.items(), key=lambda x: x[1], reverse=True)
    top_3_emitters = [Top3Emitter(category=k, emissions=v) for k, v in sorted_emissions[:3]]
    
    return EmissionResult(
        event_id=event_id,
        event_name=event_obj.event_name,
        total_emissions_kg=total_emissions_kg,
        emissions_by_category=emissions_by_category,
        emissions_per_participant=emissions_per_participant,
        emission_class=emission_class,
        top_3_emitters=top_3_emitters
    )


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()