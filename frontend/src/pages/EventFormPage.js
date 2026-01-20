import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { Leaf, Save, TrendingUp, ArrowLeft } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EventFormPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [eventData, setEventData] = useState({
    event_name: "",
    event_type: "conference",
    event_duration_days: 1,
    start_date: "",
    end_date: "",
    total_visitors: 0,
    visitors_foreign: 0,
    visitors_national_non_idf: 0,
    visitors_idf: 0,
    total_exhibitors: 0,
    exhibitors_foreign: 0,
    exhibitors_national_non_idf: 0,
    exhibitors_idf: 0,
    organizers_count: 0,
  });

  const [energyData, setEnergyData] = useState({
    approach: "estimated",
    gas_kwh: 0,
    fuel_liters: 0,
    electricity_kwh: 0,
    coal_kg: 0,
    building_type: "sport_leisure_culture",
    surface_m2: 0,
    has_generators: false,
    generators_fuel_liters: 0,
  });

  const [transportData, setTransportData] = useState({
    visitors_avg_distance_foreign_km: 0,
    visitors_avg_distance_national_km: 0,
    visitors_local_transport_expenses: 0,
    exhibitors_avg_distance_foreign_km: 0,
    exhibitors_avg_distance_national_km: 0,
    exhibitors_local_transport_expenses: 0,
    organizers_avg_distance_km: 0,
    organizers_round_trips: 0,
  });

  const [cateringData, setCateringData] = useState({
    breakfasts_count: 0,
    lunches_count: 0,
    dinners_count: 0,
    snacks_count: 0,
    meals_meat_heavy_pct: 50,
    meals_balanced_pct: 30,
    meals_vegetarian_pct: 20,
    dishes_type: "disposable",
    water_liters: 0,
    coffee_units: 0,
    soft_drinks_units: 0,
    alcohol_units: 0,
  });

  const [accommodationData, setAccommodationData] = useState({
    foreign_hotel_5star_pct: 0,
    foreign_hotel_3star_pct: 0,
    foreign_hotel_1star_pct: 0,
    foreign_other_accommodation_pct: 0,
    foreign_family_pct: 0,
    foreign_avg_nights: 0,
    national_hotel_5star_pct: 0,
    national_hotel_3star_pct: 0,
    national_hotel_1star_pct: 0,
    national_other_accommodation_pct: 0,
    national_family_pct: 0,
    national_avg_nights: 0,
  });

  const [wasteData, setWasteData] = useState({
    plastic_kg: 0,
    cardboard_kg: 0,
    paper_kg: 0,
    aluminum_kg: 0,
    textile_kg: 0,
    furniture_kg: 0,
  });

  const [communicationData, setCommunicationData] = useState({
    posters_count: 0,
    flyers_count: 0,
    banners_count: 0,
    streaming_hours: 0,
    streaming_audience: 0,
    communication_expenses: 0,
  });

  const [freightData, setFreightData] = useState({
    decor_weight_kg: 0,
    decor_distance_km: 0,
    equipment_weight_kg: 0,
    equipment_distance_km: 0,
    food_weight_kg: 0,
    food_distance_km: 0,
  });

  const [amenitiesData, setAmenitiesData] = useState({
    site_rental_expenses: 0,
    reception_expenses: 0,
    construction_expenses: 0,
    it_expenses: 0,
  });

  const [purchasesData, setPurchasesData] = useState({
    goodies_expenses_per_person: 0,
    badges_visitors: 0,
    badges_exhibitors: 0,
    badges_organizers: 0,
    badges_type: "plastic_soft",
  });

  const handleSaveEvent = async () => {
    if (!eventData.event_name) {
      toast.error("Veuillez saisir le nom de l'événement");
      return;
    }

    setLoading(true);
    try {
      // Create event
      const eventResponse = await axios.post(`${API}/events`, eventData);
      const newEventId = eventResponse.data.id;

      // Save all data with event_id
      await Promise.all([
        axios.post(`${API}/energy`, { ...energyData, event_id: newEventId }),
        axios.post(`${API}/transport`, { ...transportData, event_id: newEventId }),
        axios.post(`${API}/catering`, { ...cateringData, event_id: newEventId }),
        axios.post(`${API}/accommodation`, { ...accommodationData, event_id: newEventId }),
        axios.post(`${API}/waste`, { ...wasteData, event_id: newEventId }),
        axios.post(`${API}/communication`, { ...communicationData, event_id: newEventId }),
        axios.post(`${API}/freight`, { ...freightData, event_id: newEventId }),
        axios.post(`${API}/amenities`, { ...amenitiesData, event_id: newEventId }),
        axios.post(`${API}/purchases`, { ...purchasesData, event_id: newEventId }),
      ]);

      toast.success("Événement enregistré avec succès !");
      navigate(`/results/${newEventId}`);
    } catch (error) {
      console.error("Error saving event:", error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#0d5f4d] flex items-center justify-center">
                <Leaf className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-[#0d5f4d]" style={{ fontFamily: 'Manrope, sans-serif' }}>Éco-Calculateur</h1>
            </div>
            <Button data-testid="back-home-btn" onClick={() => navigate('/')} variant="outline" className="border-[#0d5f4d] text-[#0d5f4d] hover:bg-[#f0f7f5]">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[#0d5f4d] mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>Nouvel Événement</h2>
          <p className="text-gray-600">Renseignez les informations de votre événement pour calculer son empreinte carbone</p>
        </div>

        {/* General Information */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
          <h3 className="text-xl font-bold text-[#0d5f4d] mb-6" style={{ fontFamily: 'Manrope, sans-serif' }}>Informations Générales</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="event_name" className="text-gray-700 font-medium">Nom de l'événement *</Label>
              <Input
                id="event_name"
                data-testid="event-name-input"
                value={eventData.event_name}
                onChange={(e) => setEventData({ ...eventData, event_name: e.target.value })}
                placeholder="Ex: Salon Tech Paris 2024"
                className="mt-2 border-gray-300 focus:border-[#0d5f4d] focus:ring-[#0d5f4d]"
              />
            </div>
            <div>
              <Label htmlFor="event_type" className="text-gray-700 font-medium">Type d'événement</Label>
              <Select value={eventData.event_type} onValueChange={(value) => setEventData({ ...eventData, event_type: value })}>
                <SelectTrigger data-testid="event-type-select" className="mt-2 border-gray-300 focus:border-[#0d5f4d] focus:ring-[#0d5f4d]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conference">Conférence</SelectItem>
                  <SelectItem value="trade_show">Salon professionnel</SelectItem>
                  <SelectItem value="sports">Evénement sportif</SelectItem>
                  <SelectItem value="cultural">Evénement culturel</SelectItem>
                  <SelectItem value="corporate">Evénement d'entreprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="event_duration" className="text-gray-700 font-medium">Durée (événement jours)</Label>
              <Input
                id="event_duration"
                data-testid="event-duration-input"
                type="number"
                value={eventData.event_duration_days}
                onChange={(e) => setEventData({ ...eventData, event_duration_days: parseInt(e.target.value) || 0 })}
                className="mt-2 border-gray-300 focus:border-[#0d5f4d] focus:ring-[#0d5f4d]"
              />
            </div>
            <div>
              <Label htmlFor="total_visitors" className="text-gray-700 font-medium">Nombre total de visiteurs</Label>
              <Input
                id="total_visitors"
                data-testid="total-visitors-input"
                type="number"
                value={eventData.total_visitors}
                onChange={(e) => setEventData({ ...eventData, total_visitors: parseInt(e.target.value) || 0 })}
                className="mt-2 border-gray-300 focus:border-[#0d5f4d] focus:ring-[#0d5f4d]"
              />
            </div>
            <div>
              <Label htmlFor="visitors_foreign" className="text-gray-700 font-medium">Visiteurs étrangers</Label>
              <Input
                id="visitors_foreign"
                type="number"
                value={eventData.visitors_foreign}
                onChange={(e) => setEventData({ ...eventData, visitors_foreign: parseInt(e.target.value) || 0 })}
                className="mt-2 border-gray-300 focus:border-[#0d5f4d] focus:ring-[#0d5f4d]"
              />
            </div>
            <div>
              <Label htmlFor="visitors_national" className="text-gray-700 font-medium">Visiteurs nationaux (hors IDF)</Label>
              <Input
                id="visitors_national"
                type="number"
                value={eventData.visitors_national_non_idf}
                onChange={(e) => setEventData({ ...eventData, visitors_national_non_idf: parseInt(e.target.value) || 0 })}
                className="mt-2 border-gray-300 focus:border-[#0d5f4d] focus:ring-[#0d5f4d]"
              />
            </div>
            <div>
              <Label htmlFor="visitors_idf" className="text-gray-700 font-medium">Visiteurs franciliens</Label>
              <Input
                id="visitors_idf"
                type="number"
                value={eventData.visitors_idf}
                onChange={(e) => setEventData({ ...eventData, visitors_idf: parseInt(e.target.value) || 0 })}
                className="mt-2 border-gray-300 focus:border-[#0d5f4d] focus:ring-[#0d5f4d]"
              />
            </div>
            <div>
              <Label htmlFor="total_exhibitors" className="text-gray-700 font-medium">Nombre total d'exposants</Label>
              <Input
                id="total_exhibitors"
                data-testid="total-exhibitors-input"
                type="number"
                value={eventData.total_exhibitors}
                onChange={(e) => setEventData({ ...eventData, total_exhibitors: parseInt(e.target.value) || 0 })}
                className="mt-2 border-gray-300 focus:border-[#0d5f4d] focus:ring-[#0d5f4d]"
              />
            </div>
            <div>
              <Label htmlFor="exhibitors_foreign" className="text-gray-700 font-medium">Exposants étrangers</Label>
              <Input
                id="exhibitors_foreign"
                type="number"
                value={eventData.exhibitors_foreign}
                onChange={(e) => setEventData({ ...eventData, exhibitors_foreign: parseInt(e.target.value) || 0 })}
                className="mt-2 border-gray-300 focus:border-[#0d5f4d] focus:ring-[#0d5f4d]"
              />
            </div>
            <div>
              <Label htmlFor="exhibitors_national" className="text-gray-700 font-medium">Exposants nationaux (hors IDF)</Label>
              <Input
                id="exhibitors_national"
                type="number"
                value={eventData.exhibitors_national_non_idf}
                onChange={(e) => setEventData({ ...eventData, exhibitors_national_non_idf: parseInt(e.target.value) || 0 })}
                className="mt-2 border-gray-300 focus:border-[#0d5f4d] focus:ring-[#0d5f4d]"
              />
            </div>
            <div>
              <Label htmlFor="exhibitors_idf" className="text-gray-700 font-medium">Exposants franciliens</Label>
              <Input
                id="exhibitors_idf"
                type="number"
                value={eventData.exhibitors_idf}
                onChange={(e) => setEventData({ ...eventData, exhibitors_idf: parseInt(e.target.value) || 0 })}
                className="mt-2 border-gray-300 focus:border-[#0d5f4d] focus:ring-[#0d5f4d]"
              />
            </div>
            <div>
              <Label htmlFor="organizers_count" className="text-gray-700 font-medium">Nombre d'organisateurs</Label>
              <Input
                id="organizers_count"
                type="number"
                value={eventData.organizers_count}
                onChange={(e) => setEventData({ ...eventData, organizers_count: parseInt(e.target.value) || 0 })}
                className="mt-2 border-gray-300 focus:border-[#0d5f4d] focus:ring-[#0d5f4d]"
              />
            </div>
          </div>
        </div>

        {/* Detailed Data - Accordion */}
        <Accordion type="multiple" className="space-y-4">
          {/* Energy */}
          <AccordionItem value="energy" className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
            <AccordionTrigger data-testid="energy-accordion" className="px-6 py-4 hover:bg-[#f0f7f5] hover:no-underline">
              <span className="text-lg font-bold text-[#0d5f4d]" style={{ fontFamily: 'Manrope, sans-serif' }}>Énergie</span>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-700 font-medium">Approche</Label>
                  <Select value={energyData.approach} onValueChange={(value) => setEnergyData({ ...energyData, approach: value })}>
                    <SelectTrigger className="mt-2 border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="real">Consommation réelle</SelectItem>
                      <SelectItem value="estimated">Consommation estimée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {energyData.approach === "real" ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-700">Gaz (kWh)</Label>
                      <Input type="number" value={energyData.gas_kwh} onChange={(e) => setEnergyData({ ...energyData, gas_kwh: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                    </div>
                    <div>
                      <Label className="text-gray-700">Fioul (litres)</Label>
                      <Input type="number" value={energyData.fuel_liters} onChange={(e) => setEnergyData({ ...energyData, fuel_liters: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                    </div>
                    <div>
                      <Label className="text-gray-700">Électricité (kWh)</Label>
                      <Input type="number" value={energyData.electricity_kwh} onChange={(e) => setEnergyData({ ...energyData, electricity_kwh: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                    </div>
                    <div>
                      <Label className="text-gray-700">Charbon (kg)</Label>
                      <Input type="number" value={energyData.coal_kg} onChange={(e) => setEnergyData({ ...energyData, coal_kg: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                    </div>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-700">Type de bâtiment</Label>
                      <Select value={energyData.building_type} onValueChange={(value) => setEnergyData({ ...energyData, building_type: value })}>
                        <SelectTrigger className="mt-2 border-gray-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="offices">Bureaux</SelectItem>
                          <SelectItem value="retail">Commerces</SelectItem>
                          <SelectItem value="health">Santé</SelectItem>
                          <SelectItem value="hotel_restaurant">Hôtels et restaurants</SelectItem>
                          <SelectItem value="sport_leisure_culture">Sport, loisir et culture</SelectItem>
                          <SelectItem value="education">Enseignement</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-gray-700">Surface (m²)</Label>
                      <Input type="number" value={energyData.surface_m2} onChange={(e) => setEnergyData({ ...energyData, surface_m2: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="checkbox"
                      checked={energyData.has_generators}
                      onChange={(e) => setEnergyData({ ...energyData, has_generators: e.target.checked })}
                      className="h-4 w-4 text-[#0d5f4d] border-gray-300 rounded focus:ring-[#0d5f4d]"
                    />
                    <Label className="text-gray-700 font-medium">Groupes électrogènes utilisés</Label>
                  </div>
                  {energyData.has_generators && (
                    <div>
                      <Label className="text-gray-700">Fioul générateurs (litres)</Label>
                      <Input type="number" value={energyData.generators_fuel_liters} onChange={(e) => setEnergyData({ ...energyData, generators_fuel_liters: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                    </div>
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Transport */}
          <AccordionItem value="transport" className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
            <AccordionTrigger data-testid="transport-accordion" className="px-6 py-4 hover:bg-[#f0f7f5] hover:no-underline">
              <span className="text-lg font-bold text-[#0d5f4d]" style={{ fontFamily: 'Manrope, sans-serif' }}>Transport</span>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-[#0d5f4d] mb-3">Visiteurs</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-700">Distance moyenne étrangers (km)</Label>
                      <Input type="number" value={transportData.visitors_avg_distance_foreign_km} onChange={(e) => setTransportData({ ...transportData, visitors_avg_distance_foreign_km: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                    </div>
                    <div>
                      <Label className="text-gray-700">Distance moyenne nationaux (km)</Label>
                      <Input type="number" value={transportData.visitors_avg_distance_national_km} onChange={(e) => setTransportData({ ...transportData, visitors_avg_distance_national_km: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-gray-700">Dépenses transport local (€)</Label>
                      <Input type="number" value={transportData.visitors_local_transport_expenses} onChange={(e) => setTransportData({ ...transportData, visitors_local_transport_expenses: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h4 className="font-semibold text-[#0d5f4d] mb-3">Exposants</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-700">Distance moyenne étrangers (km)</Label>
                      <Input type="number" value={transportData.exhibitors_avg_distance_foreign_km} onChange={(e) => setTransportData({ ...transportData, exhibitors_avg_distance_foreign_km: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                    </div>
                    <div>
                      <Label className="text-gray-700">Distance moyenne nationaux (km)</Label>
                      <Input type="number" value={transportData.exhibitors_avg_distance_national_km} onChange={(e) => setTransportData({ ...transportData, exhibitors_avg_distance_national_km: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-gray-700">Dépenses transport local (€)</Label>
                      <Input type="number" value={transportData.exhibitors_local_transport_expenses} onChange={(e) => setTransportData({ ...transportData, exhibitors_local_transport_expenses: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h4 className="font-semibold text-[#0d5f4d] mb-3">Organisateurs</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-700">Distance moyenne (km)</Label>
                      <Input type="number" value={transportData.organizers_avg_distance_km} onChange={(e) => setTransportData({ ...transportData, organizers_avg_distance_km: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                    </div>
                    <div>
                      <Label className="text-gray-700">Nombre d'allers-retours</Label>
                      <Input type="number" value={transportData.organizers_round_trips} onChange={(e) => setTransportData({ ...transportData, organizers_round_trips: parseInt(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Catering */}
          <AccordionItem value="catering" className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
            <AccordionTrigger data-testid="catering-accordion" className="px-6 py-4 hover:bg-[#f0f7f5] hover:no-underline">
              <span className="text-lg font-bold text-[#0d5f4d]" style={{ fontFamily: 'Manrope, sans-serif' }}>Restauration</span>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-700">Petits-déjeuners</Label>
                    <Input type="number" value={cateringData.breakfasts_count} onChange={(e) => setCateringData({ ...cateringData, breakfasts_count: parseInt(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                  </div>
                  <div>
                    <Label className="text-gray-700">Déjeuners</Label>
                    <Input type="number" value={cateringData.lunches_count} onChange={(e) => setCateringData({ ...cateringData, lunches_count: parseInt(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                  </div>
                  <div>
                    <Label className="text-gray-700">Dîners</Label>
                    <Input type="number" value={cateringData.dinners_count} onChange={(e) => setCateringData({ ...cateringData, dinners_count: parseInt(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                  </div>
                  <div>
                    <Label className="text-gray-700">Collations</Label>
                    <Input type="number" value={cateringData.snacks_count} onChange={(e) => setCateringData({ ...cateringData, snacks_count: parseInt(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h4 className="font-semibold text-[#0d5f4d] mb-3">Répartition des repas (%)</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-gray-700">Viande importante</Label>
                      <Input type="number" value={cateringData.meals_meat_heavy_pct} onChange={(e) => setCateringData({ ...cateringData, meals_meat_heavy_pct: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                    </div>
                    <div>
                      <Label className="text-gray-700">Équilibré</Label>
                      <Input type="number" value={cateringData.meals_balanced_pct} onChange={(e) => setCateringData({ ...cateringData, meals_balanced_pct: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                    </div>
                    <div>
                      <Label className="text-gray-700">Végétarien</Label>
                      <Input type="number" value={cateringData.meals_vegetarian_pct} onChange={(e) => setCateringData({ ...cateringData, meals_vegetarian_pct: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div>
                    <Label className="text-gray-700 font-medium">Type de vaisselle</Label>
                    <Select value={cateringData.dishes_type} onValueChange={(value) => setCateringData({ ...cateringData, dishes_type: value })}>
                      <SelectTrigger className="mt-2 border-gray-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="disposable">Jetable</SelectItem>
                        <SelectItem value="reusable">Réutilisable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h4 className="font-semibold text-[#0d5f4d] mb-3">Boissons</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-700">Eau (litres)</Label>
                      <Input type="number" value={cateringData.water_liters} onChange={(e) => setCateringData({ ...cateringData, water_liters: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                    </div>
                    <div>
                      <Label className="text-gray-700">Cafés (unités)</Label>
                      <Input type="number" value={cateringData.coffee_units} onChange={(e) => setCateringData({ ...cateringData, coffee_units: parseInt(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                    </div>
                    <div>
                      <Label className="text-gray-700">Boissons soft (unités)</Label>
                      <Input type="number" value={cateringData.soft_drinks_units} onChange={(e) => setCateringData({ ...cateringData, soft_drinks_units: parseInt(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                    </div>
                    <div>
                      <Label className="text-gray-700">Alcool (unités)</Label>
                      <Input type="number" value={cateringData.alcohol_units} onChange={(e) => setCateringData({ ...cateringData, alcohol_units: parseInt(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Accommodation */}
          <AccordionItem value="accommodation" className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
            <AccordionTrigger data-testid="accommodation-accordion" className="px-6 py-4 hover:bg-[#f0f7f5] hover:no-underline">
              <span className="text-lg font-bold text-[#0d5f4d]" style={{ fontFamily: 'Manrope, sans-serif' }}>Hébergements</span>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-[#0d5f4d] mb-3">Visiteurs étrangers</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-700">Hôtel 5* (%)</Label>
                      <Input type="number" value={accommodationData.foreign_hotel_5star_pct} onChange={(e) => setAccommodationData({ ...accommodationData, foreign_hotel_5star_pct: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                    </div>
                    <div>
                      <Label className="text-gray-700">Hôtel 2-3* (%)</Label>
                      <Input type="number" value={accommodationData.foreign_hotel_3star_pct} onChange={(e) => setAccommodationData({ ...accommodationData, foreign_hotel_3star_pct: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                    </div>
                    <div>
                      <Label className="text-gray-700">Hôtel 0-1* (%)</Label>
                      <Input type="number" value={accommodationData.foreign_hotel_1star_pct} onChange={(e) => setAccommodationData({ ...accommodationData, foreign_hotel_1star_pct: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                    </div>
                    <div>
                      <Label className="text-gray-700">Autre hébergement (%)</Label>
                      <Input type="number" value={accommodationData.foreign_other_accommodation_pct} onChange={(e) => setAccommodationData({ ...accommodationData, foreign_other_accommodation_pct: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                    </div>
                    <div>
                      <Label className="text-gray-700">Famille/amis (%)</Label>
                      <Input type="number" value={accommodationData.foreign_family_pct} onChange={(e) => setAccommodationData({ ...accommodationData, foreign_family_pct: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                    </div>
                    <div>
                      <Label className="text-gray-700">Nombre moyen de nuitées</Label>
                      <Input type="number" value={accommodationData.foreign_avg_nights} onChange={(e) => setAccommodationData({ ...accommodationData, foreign_avg_nights: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h4 className="font-semibold text-[#0d5f4d] mb-3">Visiteurs nationaux (hors IDF)</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-700">Hôtel 5* (%)</Label>
                      <Input type="number" value={accommodationData.national_hotel_5star_pct} onChange={(e) => setAccommodationData({ ...accommodationData, national_hotel_5star_pct: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                    </div>
                    <div>
                      <Label className="text-gray-700">Hôtel 2-3* (%)</Label>
                      <Input type="number" value={accommodationData.national_hotel_3star_pct} onChange={(e) => setAccommodationData({ ...accommodationData, national_hotel_3star_pct: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                    </div>
                    <div>
                      <Label className="text-gray-700">Hôtel 0-1* (%)</Label>
                      <Input type="number" value={accommodationData.national_hotel_1star_pct} onChange={(e) => setAccommodationData({ ...accommodationData, national_hotel_1star_pct: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                    </div>
                    <div>
                      <Label className="text-gray-700">Autre hébergement (%)</Label>
                      <Input type="number" value={accommodationData.national_other_accommodation_pct} onChange={(e) => setAccommodationData({ ...accommodationData, national_other_accommodation_pct: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                    </div>
                    <div>
                      <Label className="text-gray-700">Famille/amis (%)</Label>
                      <Input type="number" value={accommodationData.national_family_pct} onChange={(e) => setAccommodationData({ ...accommodationData, national_family_pct: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                    </div>
                    <div>
                      <Label className="text-gray-700">Nombre moyen de nuitées</Label>
                      <Input type="number" value={accommodationData.national_avg_nights} onChange={(e) => setAccommodationData({ ...accommodationData, national_avg_nights: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Other categories - simplified inputs */}
          <AccordionItem value="waste" className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
            <AccordionTrigger className="px-6 py-4 hover:bg-[#f0f7f5] hover:no-underline">
              <span className="text-lg font-bold text-[#0d5f4d]" style={{ fontFamily: 'Manrope, sans-serif' }}>Déchets</span>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-700">Plastique (kg)</Label>
                  <Input type="number" value={wasteData.plastic_kg} onChange={(e) => setWasteData({ ...wasteData, plastic_kg: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                </div>
                <div>
                  <Label className="text-gray-700">Carton (kg)</Label>
                  <Input type="number" value={wasteData.cardboard_kg} onChange={(e) => setWasteData({ ...wasteData, cardboard_kg: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                </div>
                <div>
                  <Label className="text-gray-700">Papier (kg)</Label>
                  <Input type="number" value={wasteData.paper_kg} onChange={(e) => setWasteData({ ...wasteData, paper_kg: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                </div>
                <div>
                  <Label className="text-gray-700">Aluminium (kg)</Label>
                  <Input type="number" value={wasteData.aluminum_kg} onChange={(e) => setWasteData({ ...wasteData, aluminum_kg: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                </div>
                <div>
                  <Label className="text-gray-700">Textile (kg)</Label>
                  <Input type="number" value={wasteData.textile_kg} onChange={(e) => setWasteData({ ...wasteData, textile_kg: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                </div>
                <div>
                  <Label className="text-gray-700">Ameublement (kg)</Label>
                  <Input type="number" value={wasteData.furniture_kg} onChange={(e) => setWasteData({ ...wasteData, furniture_kg: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="communication" className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
            <AccordionTrigger className="px-6 py-4 hover:bg-[#f0f7f5] hover:no-underline">
              <span className="text-lg font-bold text-[#0d5f4d]" style={{ fontFamily: 'Manrope, sans-serif' }}>Communication</span>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-700">Affiches</Label>
                  <Input type="number" value={communicationData.posters_count} onChange={(e) => setCommunicationData({ ...communicationData, posters_count: parseInt(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                </div>
                <div>
                  <Label className="text-gray-700">Flyers</Label>
                  <Input type="number" value={communicationData.flyers_count} onChange={(e) => setCommunicationData({ ...communicationData, flyers_count: parseInt(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                </div>
                <div>
                  <Label className="text-gray-700">Banderoles/Kakémonos</Label>
                  <Input type="number" value={communicationData.banners_count} onChange={(e) => setCommunicationData({ ...communicationData, banners_count: parseInt(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                </div>
                <div>
                  <Label className="text-gray-700">Streaming (heures)</Label>
                  <Input type="number" value={communicationData.streaming_hours} onChange={(e) => setCommunicationData({ ...communicationData, streaming_hours: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                </div>
                <div>
                  <Label className="text-gray-700">Audience streaming</Label>
                  <Input type="number" value={communicationData.streaming_audience} onChange={(e) => setCommunicationData({ ...communicationData, streaming_audience: parseInt(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                </div>
                <div>
                  <Label className="text-gray-700">Dépenses communication (€)</Label>
                  <Input type="number" value={communicationData.communication_expenses} onChange={(e) => setCommunicationData({ ...communicationData, communication_expenses: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="freight" className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
            <AccordionTrigger className="px-6 py-4 hover:bg-[#f0f7f5] hover:no-underline">
              <span className="text-lg font-bold text-[#0d5f4d]" style={{ fontFamily: 'Manrope, sans-serif' }}>Fret et Transport de Marchandises</span>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-[#0d5f4d] mb-3">Décors et aménagements</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-700">Poids (kg)</Label>
                      <Input type="number" value={freightData.decor_weight_kg} onChange={(e) => setFreightData({ ...freightData, decor_weight_kg: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                    </div>
                    <div>
                      <Label className="text-gray-700">Distance (km)</Label>
                      <Input type="number" value={freightData.decor_distance_km} onChange={(e) => setFreightData({ ...freightData, decor_distance_km: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-[#0d5f4d] mb-3">Équipements</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-700">Poids (kg)</Label>
                      <Input type="number" value={freightData.equipment_weight_kg} onChange={(e) => setFreightData({ ...freightData, equipment_weight_kg: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                    </div>
                    <div>
                      <Label className="text-gray-700">Distance (km)</Label>
                      <Input type="number" value={freightData.equipment_distance_km} onChange={(e) => setFreightData({ ...freightData, equipment_distance_km: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-[#0d5f4d] mb-3">Produits de restauration</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-700">Poids (kg)</Label>
                      <Input type="number" value={freightData.food_weight_kg} onChange={(e) => setFreightData({ ...freightData, food_weight_kg: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                    </div>
                    <div>
                      <Label className="text-gray-700">Distance (km)</Label>
                      <Input type="number" value={freightData.food_distance_km} onChange={(e) => setFreightData({ ...freightData, food_distance_km: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="amenities" className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
            <AccordionTrigger className="px-6 py-4 hover:bg-[#f0f7f5] hover:no-underline">
              <span className="text-lg font-bold text-[#0d5f4d]" style={{ fontFamily: 'Manrope, sans-serif' }}>Aménagements et Accueil</span>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-700">Location du site (€)</Label>
                  <Input type="number" value={amenitiesData.site_rental_expenses} onChange={(e) => setAmenitiesData({ ...amenitiesData, site_rental_expenses: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                </div>
                <div>
                  <Label className="text-gray-700">Service d'accueil (€)</Label>
                  <Input type="number" value={amenitiesData.reception_expenses} onChange={(e) => setAmenitiesData({ ...amenitiesData, reception_expenses: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                </div>
                <div>
                  <Label className="text-gray-700">Construction (€)</Label>
                  <Input type="number" value={amenitiesData.construction_expenses} onChange={(e) => setAmenitiesData({ ...amenitiesData, construction_expenses: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                </div>
                <div>
                  <Label className="text-gray-700">Informatique et électronique (€)</Label>
                  <Input type="number" value={amenitiesData.it_expenses} onChange={(e) => setAmenitiesData({ ...amenitiesData, it_expenses: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="purchases" className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
            <AccordionTrigger className="px-6 py-4 hover:bg-[#f0f7f5] hover:no-underline">
              <span className="text-lg font-bold text-[#0d5f4d]" style={{ fontFamily: 'Manrope, sans-serif' }}>Achats et Goodies</span>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-6">
                <div>
                  <Label className="text-gray-700 font-medium">Dépenses goodies par personne (€)</Label>
                  <Input type="number" value={purchasesData.goodies_expenses_per_person} onChange={(e) => setPurchasesData({ ...purchasesData, goodies_expenses_per_person: parseFloat(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="font-semibold text-[#0d5f4d] mb-3">Badges</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-700">Badges visiteurs</Label>
                      <Input type="number" value={purchasesData.badges_visitors} onChange={(e) => setPurchasesData({ ...purchasesData, badges_visitors: parseInt(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                    </div>
                    <div>
                      <Label className="text-gray-700">Badges exposants</Label>
                      <Input type="number" value={purchasesData.badges_exhibitors} onChange={(e) => setPurchasesData({ ...purchasesData, badges_exhibitors: parseInt(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                    </div>
                    <div>
                      <Label className="text-gray-700">Badges organisateurs</Label>
                      <Input type="number" value={purchasesData.badges_organizers} onChange={(e) => setPurchasesData({ ...purchasesData, badges_organizers: parseInt(e.target.value) || 0 })} className="mt-2 border-gray-300" />
                    </div>
                    <div>
                      <Label className="text-gray-700">Type de badges</Label>
                      <Select value={purchasesData.badges_type} onValueChange={(value) => setPurchasesData({ ...purchasesData, badges_type: value })}>
                        <SelectTrigger className="mt-2 border-gray-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="plastic_soft">Plastique souple</SelectItem>
                          <SelectItem value="plastic_hard">Plastique rigide</SelectItem>
                          <SelectItem value="textile">Textile</SelectItem>
                          <SelectItem value="paper">Papier</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Save Button */}
        <div className="mt-8 flex justify-center">
          <Button 
            data-testid="save-calculate-btn"
            onClick={handleSaveEvent}
            disabled={loading}
            className="bg-[#0d5f4d] hover:bg-[#0a4a3d] text-white px-12 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            {loading ? (
              <span>Enregistrement...</span>
            ) : (
              <>
                <TrendingUp className="mr-2 h-5 w-5" />
                Calculer l'empreinte carbone
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EventFormPage;