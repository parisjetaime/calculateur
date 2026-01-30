import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Leaf, Save, TrendingUp, ArrowLeft, ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";
import GeneralSection from "@/components/GeneralSection";
import EnergySection from "@/components/EnergySection";
import TransportSection from "@/components/TransportSection";
import AmenitiesSection from "@/components/AmenitiesSection";
import CateringSection from "@/components/CateringSection";
import AccommodationSection from "@/components/AccommodationSection";
import PurchasesSection from "@/components/PurchasesSection";
import CommunicationSection from "@/components/CommunicationSection";
import FreightSection from "@/components/FreightSection";
import WasteSection from "@/components/WasteSection";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Liste des 10 modules
const MODULES = [
  { id: "general", label: "1. Général", icon: "🏢" },
  { id: "energy", label: "2. Énergie", icon: "⚡" },
  { id: "transport", label: "3. Transport", icon: "🚗" },
  { id: "amenities", label: "4. Aménagements", icon: "🏗️" },
  { id: "catering", label: "5. Restauration", icon: "🍽️" },
  { id: "accommodation", label: "6. Hébergements", icon: "🏨" },
  { id: "purchases", label: "7. Achats/Goodies", icon: "🎁" },
  { id: "communication", label: "8. Communication", icon: "📢" },
  { id: "freight", label: "9. Fret", icon: "🚚" },
  { id: "waste", label: "10. Déchets", icon: "♻️" },
];

const EventFormPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [completedModules, setCompletedModules] = useState(new Set());
  
  // État global de l'événement
  const [eventData, setEventData] = useState(null);
  const [calculatedValues, setCalculatedValues] = useState(null);
  
  // États des données de chaque module
  const [generalData, setGeneralData] = useState({});
  const [energyData, setEnergyData] = useState({});
  const [transportData, setTransportData] = useState({});
  const [amenitiesData, setAmenitiesData] = useState({});
  const [cateringData, setCateringData] = useState({});
  const [accommodationData, setAccommodationData] = useState({});
  const [purchasesData, setPurchasesData] = useState({});
  const [communicationData, setCommunicationData] = useState({});
  const [freightData, setFreightData] = useState({});
  const [wasteData, setWasteData] = useState({});

  // Sauvegarder la section Général et créer l'événement
  const handleSaveGeneral = async (data) => {
    setLoading(true);
    try {
      let response;
      if (eventData?.id) {
        // Mise à jour de l'événement existant
        // Pour l'instant, on ne peut pas mettre à jour, donc on sauvegarde localement
        setGeneralData(data);
        setCompletedModules(prev => new Set([...prev, "general"]));
        toast.success("Section Général enregistrée !");
        setActiveTab("energy");
      } else {
        // Création d'un nouvel événement
        response = await axios.post(`${API}/events`, data);
        setEventData(response.data);
        setGeneralData(data);
        setCompletedModules(prev => new Set([...prev, "general"]));
        toast.success("Événement créé avec succès !");
        setActiveTab("energy");
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder une section spécifique
  const handleSaveSection = async (section, data) => {
    if (!eventData?.id) {
      toast.error("Veuillez d'abord remplir la section Général");
      setActiveTab("general");
      return;
    }

    setLoading(true);
    try {
      const endpointMap = {
        energy: "/energy",
        transport: "/transport",
        amenities: "/amenities",
        catering: "/catering",
        accommodation: "/accommodation",
        purchases: "/purchases",
        communication: "/communication",
        freight: "/freight",
        waste: "/waste",
      };

      await axios.post(`${API}${endpointMap[section]}`, {
        ...data,
        event_id: eventData.id,
      });

      // Mettre à jour l'état local
      const stateSetters = {
        energy: setEnergyData,
        transport: setTransportData,
        amenities: setAmenitiesData,
        catering: setCateringData,
        accommodation: setAccommodationData,
        purchases: setPurchasesData,
        communication: setCommunicationData,
        freight: setFreightData,
        waste: setWasteData,
      };
      stateSetters[section](data);
      
      setCompletedModules(prev => new Set([...prev, section]));
      toast.success(`Section ${section} enregistrée !`);
      
      // Passer à la section suivante
      const currentIndex = MODULES.findIndex(m => m.id === section);
      if (currentIndex < MODULES.length - 1) {
        setActiveTab(MODULES[currentIndex + 1].id);
      }
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde de ${section}:`, error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  // Calculer les émissions
  const handleCalculateEmissions = async () => {
    if (!eventData?.id) {
      toast.error("Veuillez d'abord créer l'événement");
      return;
    }

    setLoading(true);
    try {
      navigate(`/results/${eventData.id}`);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du calcul");
    } finally {
      setLoading(false);
    }
  };

  // Navigation entre les modules
  const goToNextModule = () => {
    const currentIndex = MODULES.findIndex(m => m.id === activeTab);
    if (currentIndex < MODULES.length - 1) {
      setActiveTab(MODULES[currentIndex + 1].id);
    }
  };

  const goToPreviousModule = () => {
    const currentIndex = MODULES.findIndex(m => m.id === activeTab);
    if (currentIndex > 0) {
      setActiveTab(MODULES[currentIndex - 1].id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#0d5f4d] flex items-center justify-center">
                <Leaf className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#0d5f4d]" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  Éco-Calculateur
                </h1>
                <p className="text-xs text-gray-500">
                  {eventData?.event_name || "Nouvel événement"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                data-testid="back-home-btn" 
                onClick={() => navigate('/')} 
                variant="outline" 
                className="border-[#0d5f4d] text-[#0d5f4d] hover:bg-[#f0f7f5]"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
              {eventData?.id && (
                <Button
                  data-testid="calculate-btn"
                  onClick={handleCalculateEmissions}
                  className="bg-[#0d5f4d] hover:bg-[#0a4a3d] text-white"
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Calculer les émissions
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation des modules */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 py-2 overflow-x-auto">
            {MODULES.map((module, index) => (
              <button
                key={module.id}
                data-testid={`tab-${module.id}`}
                onClick={() => setActiveTab(module.id)}
                className={`
                  flex items-center gap-1 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all
                  ${activeTab === module.id 
                    ? 'bg-[#0d5f4d] text-white font-medium' 
                    : 'hover:bg-gray-100 text-gray-600'
                  }
                  ${completedModules.has(module.id) && activeTab !== module.id 
                    ? 'text-green-600' 
                    : ''
                  }
                `}
              >
                <span>{module.icon}</span>
                <span className="hidden sm:inline">{module.label}</span>
                <span className="sm:hidden">{index + 1}</span>
                {completedModules.has(module.id) && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Module Général */}
        {activeTab === "general" && (
          <GeneralSection
            initialData={generalData}
            onSave={handleSaveGeneral}
            onCalculatedValuesChange={setCalculatedValues}
          />
        )}

        {/* Module Énergie */}
        {activeTab === "energy" && (
          <EnergySection
            initialData={energyData}
            eventData={eventData}
            calculatedValues={calculatedValues}
            onSave={(data) => handleSaveSection("energy", data)}
          />
        )}

        {/* Module Transport */}
        {activeTab === "transport" && (
          <TransportSection
            initialData={transportData}
            eventData={eventData}
            calculatedValues={calculatedValues}
            onSave={(data) => handleSaveSection("transport", data)}
          />
        )}

        {/* Module Aménagements */}
        {activeTab === "amenities" && (
          <AmenitiesSection
            initialData={amenitiesData}
            eventData={eventData}
            calculatedValues={calculatedValues}
            onSave={(data) => handleSaveSection("amenities", data)}
          />
        )}

        {/* Module Restauration */}
        {activeTab === "catering" && (
          <CateringSection
            initialData={cateringData}
            eventData={eventData}
            calculatedValues={calculatedValues}
            onSave={(data) => handleSaveSection("catering", data)}
          />
        )}

        {/* Module Hébergements */}
        {activeTab === "accommodation" && (
          <AccommodationSection
            initialData={accommodationData}
            eventData={eventData}
            calculatedValues={calculatedValues}
            onSave={(data) => handleSaveSection("accommodation", data)}
          />
        )}

        {/* Module Achats/Goodies */}
        {activeTab === "purchases" && (
          <PurchasesSection
            initialData={purchasesData}
            eventData={eventData}
            calculatedValues={calculatedValues}
            onSave={(data) => handleSaveSection("purchases", data)}
          />
        )}

        {/* Module Communication */}
        {activeTab === "communication" && (
          <CommunicationSection
            initialData={communicationData}
            eventData={eventData}
            calculatedValues={calculatedValues}
            onSave={(data) => handleSaveSection("communication", data)}
          />
        )}

        {/* Module Fret */}
        {activeTab === "freight" && (
          <FreightSection
            initialData={freightData}
            eventData={eventData}
            calculatedValues={calculatedValues}
            onSave={(data) => handleSaveSection("freight", data)}
          />
        )}

        {/* Module Déchets */}
        {activeTab === "waste" && (
          <WasteSection
            initialData={wasteData}
            eventData={eventData}
            calculatedValues={calculatedValues}
            onSave={(data) => handleSaveSection("waste", data)}
          />
        )}

        {/* Navigation en bas de page */}
        <div className="mt-6 flex justify-between items-center">
          <Button
            variant="outline"
            onClick={goToPreviousModule}
            disabled={activeTab === "general"}
            className="border-[#0d5f4d] text-[#0d5f4d]"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Module précédent
          </Button>
          
          <div className="text-sm text-gray-500">
            Module {MODULES.findIndex(m => m.id === activeTab) + 1} sur {MODULES.length}
          </div>
          
          <Button
            onClick={goToNextModule}
            disabled={activeTab === "waste"}
            className="bg-[#0d5f4d] hover:bg-[#0a4a3d] text-white"
          >
            Module suivant
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </main>
    </div>
  );
};

export default EventFormPage;
