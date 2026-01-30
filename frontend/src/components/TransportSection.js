import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Calculator, Plane, Train, Users } from "lucide-react";

// Ratios monétaires moyens (kgCO2/k€)
const MONETARY_RATIOS = {
  foreigners: 869.82,
  nationals_non_idf: 634.13,
  nationals_idf: 560
};

// Facteurs d'émission pour les modes de transport des organisateurs (kgCO2/pers.km)
const TRANSPORT_MODES = [
  { id: "Voiture (moyenne)", label: "Voiture (moyenne)", factor: 0.216 },
  { id: "Voiture (essence)", label: "Voiture (essence)", factor: 0.223 },
  { id: "Voiture (gazole)", label: "Voiture (gazole)", factor: 0.212 },
  { id: "Voiture électrique", label: "Voiture électrique", factor: 0.103 },
  { id: "Avion (court courrier)", label: "Avion (court courrier)", factor: 0.259 },
  { id: "Avion (moyen courrier)", label: "Avion (moyen courrier)", factor: 0.187 },
  { id: "Avion (long courrier)", label: "Avion (long courrier)", factor: 0.152 },
  { id: "Métro- IDF", label: "Métro IDF", factor: 0.00404 },
  { id: "RER ou transilien", label: "RER ou Transilien", factor: 0.00938 },
  { id: "Tramway- IDF", label: "Tramway IDF", factor: 0.00388 },
  { id: "TGV", label: "TGV", factor: 0.00334 },
  { id: "TER traction moyenne", label: "TER", factor: 0.0317 },
  { id: "Train grande ligne", label: "Train grande ligne", factor: 0.00592 },
  { id: "Autobus moyen", label: "Autobus moyen", factor: 0.202 },
  { id: "Autobus électrique", label: "Autobus électrique", factor: 0.0217 },
  { id: "Trottinette électrique", label: "Trottinette électrique", factor: 0.0249 },
  { id: "Vélo électrique", label: "Vélo électrique", factor: 0.011 },
  { id: "Moto =< 250 cm3", label: "Moto ≤ 250 cm³", factor: 0.0736 },
  { id: "Moto > 250 cm3", label: "Moto > 250 cm³", factor: 0.194 },
];

const TransportSection = ({ onSave, initialData, calculatedValues }) => {
  const [formData, setFormData] = useState({
    // 3.1.1. Accès à l'IDF - Visiteurs
    knows_visitor_origins: "Non",
    visitor_origins: [
      { origin: "", percentage: 0 },
      { origin: "", percentage: 0 },
      { origin: "", percentage: 0 },
      { origin: "", percentage: 0 },
    ],
    
    // 3.1.2. Transport local visiteurs (calculé automatiquement via dépenses)
    
    // 3.2.1. Accès à l'IDF - Exposants/Sportifs/Artistes
    knows_exhibitor_origins: "Non",
    exhibitor_origins: [
      { origin: "", percentage: 0 },
      { origin: "", percentage: 0 },
      { origin: "", percentage: 0 },
      { origin: "", percentage: 0 },
    ],
    
    // 3.3. Transport des organisateurs
    organizers: [
      { mode: "", count: 0, distance: 0, trips: 0 },
      { mode: "", count: 0, distance: 0, trips: 0 },
      { mode: "", count: 0, distance: 0, trips: 0 },
      { mode: "", count: 0, distance: 0, trips: 0 },
      { mode: "", count: 0, distance: 0, trips: 0 },
      { mode: "", count: 0, distance: 0, trips: 0 },
    ],
    
    ...initialData,
  });

  const [calculatedEmissions, setCalculatedEmissions] = useState({
    // Visiteurs
    visitors_foreign_access: 0,
    visitors_national_access: 0,
    visitors_local_foreign: 0,
    visitors_local_national: 0,
    visitors_local_idf: 0,
    visitors_total: 0,
    
    // Exposants
    exhibitors_foreign_access: 0,
    exhibitors_national_access: 0,
    exhibitors_local_foreign: 0,
    exhibitors_local_national: 0,
    exhibitors_local_idf: 0,
    exhibitors_total: 0,
    
    // Organisateurs
    organizers_emissions: [],
    organizers_total: 0,
    
    // Total
    total: 0,
  });

  // Récupérer les valeurs calculées du module Général
  const visitorsForEign = calculatedValues?.visitors_foreign || 0;
  const visitorsNationalNonIdf = calculatedValues?.visitors_national_non_idf || 0;
  const visitorsIdf = calculatedValues?.visitors_idf || 0;
  const exhibitorsForeign = calculatedValues?.exhibitors_foreign || 0;
  const exhibitorsNationalNonIdf = calculatedValues?.exhibitors_national_non_idf || 0;
  const exhibitorsIdf = calculatedValues?.exhibitors_idf || 0;

  // Messages d'orientation
  const getVisitorOriginMessage = () => {
    if (formData.knows_visitor_origins === "Oui") {
      return "Remplir l'onglet a) Approche par les origines";
    }
    return "Des valeurs moyennes vont être utilisées. Allez directement à l'onglet 3.2. Transport des exposants/sportifs/artistes";
  };

  const getExhibitorOriginMessage = () => {
    if (formData.knows_exhibitor_origins === "Oui") {
      return "Remplir l'onglet a) Approche par les origines";
    }
    return "Des valeurs moyennes vont être utilisées. Allez directement à l'onglet 3.3. Transport des organisateurs";
  };

  // Calculer les émissions
  const calculateEmissions = useCallback(() => {
    // Approche statistique pour les visiteurs (par défaut)
    // Dépenses transport = nb visiteurs × dépense moyenne par type
    // Émissions = Dépenses × ratio monétaire / 1000
    
    // Pour simplifier, on utilise les ratios monétaires moyens
    // Visiteurs étrangers : accès IDF
    const visitorsForEignAccess = (visitorsForEign * 200) * MONETARY_RATIOS.foreigners / 1000; // 200€ dépense moyenne
    const visitorsNationalAccess = (visitorsNationalNonIdf * 80) * MONETARY_RATIOS.nationals_non_idf / 1000; // 80€ dépense moyenne
    
    // Transport local visiteurs
    const visitorsLocalForeign = (visitorsForEign * 50) * MONETARY_RATIOS.foreigners / 1000;
    const visitorsLocalNational = (visitorsNationalNonIdf * 30) * MONETARY_RATIOS.nationals_non_idf / 1000;
    const visitorsLocalIdf = (visitorsIdf * 20) * MONETARY_RATIOS.nationals_idf / 1000;
    
    const visitorsTotal = visitorsForEignAccess + visitorsNationalAccess + 
                          visitorsLocalForeign + visitorsLocalNational + visitorsLocalIdf;

    // Exposants/Sportifs/Artistes
    const exhibitorsForeignAccess = (exhibitorsForeign * 300) * MONETARY_RATIOS.foreigners / 1000;
    const exhibitorsNationalAccess = (exhibitorsNationalNonIdf * 100) * MONETARY_RATIOS.nationals_non_idf / 1000;
    
    const exhibitorsLocalForeign = (exhibitorsForeign * 60) * MONETARY_RATIOS.foreigners / 1000;
    const exhibitorsLocalNational = (exhibitorsNationalNonIdf * 40) * MONETARY_RATIOS.nationals_non_idf / 1000;
    const exhibitorsLocalIdf = (exhibitorsIdf * 25) * MONETARY_RATIOS.nationals_idf / 1000;
    
    const exhibitorsTotal = exhibitorsForeignAccess + exhibitorsNationalAccess +
                            exhibitorsLocalForeign + exhibitorsLocalNational + exhibitorsLocalIdf;

    // Organisateurs
    const organizerEmissions = formData.organizers.map(org => {
      if (!org.mode || !org.count || !org.distance || !org.trips) return 0;
      const modeData = TRANSPORT_MODES.find(m => m.id === org.mode);
      if (!modeData) return 0;
      // Formule: nb_organisateurs × distance × nb_allers_retours × 2 × facteur_emission
      return org.count * org.distance * org.trips * 2 * modeData.factor;
    });
    const organizersTotal = organizerEmissions.reduce((sum, e) => sum + e, 0);

    const total = visitorsTotal + exhibitorsTotal + organizersTotal;

    setCalculatedEmissions({
      visitors_foreign_access: visitorsForEignAccess,
      visitors_national_access: visitorsNationalAccess,
      visitors_local_foreign: visitorsLocalForeign,
      visitors_local_national: visitorsLocalNational,
      visitors_local_idf: visitorsLocalIdf,
      visitors_total: visitorsTotal,
      
      exhibitors_foreign_access: exhibitorsForeignAccess,
      exhibitors_national_access: exhibitorsNationalAccess,
      exhibitors_local_foreign: exhibitorsLocalForeign,
      exhibitors_local_national: exhibitorsLocalNational,
      exhibitors_local_idf: exhibitorsLocalIdf,
      exhibitors_total: exhibitorsTotal,
      
      organizers_emissions: organizerEmissions,
      organizers_total: organizersTotal,
      
      total,
    });
  }, [formData, visitorsForEign, visitorsNationalNonIdf, visitorsIdf, 
      exhibitorsForeign, exhibitorsNationalNonIdf, exhibitorsIdf]);

  useEffect(() => {
    calculateEmissions();
  }, [calculateEmissions]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOrganizerChange = (index, field, value) => {
    const newOrganizers = [...formData.organizers];
    newOrganizers[index] = { ...newOrganizers[index], [field]: value };
    setFormData(prev => ({ ...prev, organizers: newOrganizers }));
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        ...formData,
        total_emissions: calculatedEmissions.total,
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* ===== COLONNE GAUCHE - SAISIE ===== */}
        <Card className="border-2 border-[#0d5f4d] shadow-lg">
          <CardHeader className="bg-[#0d5f4d] text-white py-3">
            <CardTitle className="flex items-center gap-2 text-lg" style={{ fontFamily: 'Manrope, sans-serif' }}>
              <Car className="h-5 w-5" />
              3. Transport - Saisie des données
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {/* 3.1. Transport des visiteurs */}
            <div className="border-b border-gray-200 pb-4">
              <h4 className="text-sm font-semibold text-[#0d5f4d] mb-3">3.1. Transport des visiteurs</h4>
              
              <p className="text-xs text-gray-600 mb-2">3.1.1. Accès à l'IDF</p>
              
              <div className="grid grid-cols-3 gap-2 items-center mb-2">
                <Label className="text-sm">Je connais l'origine des visiteurs étrangers</Label>
                <div className="col-span-2">
                  <Select 
                    value={formData.knows_visitor_origins} 
                    onValueChange={(val) => handleChange('knows_visitor_origins', val)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Oui">Oui</SelectItem>
                      <SelectItem value="Non">Non</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="bg-[#f0f7f5] border border-[#0d5f4d] rounded-lg p-2 mb-3">
                <p className="text-xs text-[#0d5f4d]">→ {getVisitorOriginMessage()}</p>
              </div>
            </div>

            {/* 3.2. Transport des exposants/sportifs/artistes */}
            <div className="border-b border-gray-200 pb-4">
              <h4 className="text-sm font-semibold text-[#0d5f4d] mb-3">3.2. Transport des exposants/sportifs/artistes</h4>
              
              <p className="text-xs text-gray-600 mb-2">3.2.1. Accès à l'IDF</p>
              
              <div className="grid grid-cols-3 gap-2 items-center mb-2">
                <Label className="text-sm">Je connais les pays d'origine</Label>
                <div className="col-span-2">
                  <Select 
                    value={formData.knows_exhibitor_origins} 
                    onValueChange={(val) => handleChange('knows_exhibitor_origins', val)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Oui">Oui</SelectItem>
                      <SelectItem value="Non">Non</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="bg-[#f0f7f5] border border-[#0d5f4d] rounded-lg p-2">
                <p className="text-xs text-[#0d5f4d]">→ {getExhibitorOriginMessage()}</p>
              </div>
            </div>

            {/* 3.3. Transport des organisateurs */}
            <div>
              <h4 className="text-sm font-semibold text-[#0d5f4d] mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                3.3. Transport des organisateurs
              </h4>
              
              <div className="space-y-2">
                <div className="grid grid-cols-5 gap-1 text-xs font-medium text-gray-600 mb-1">
                  <div>Mode</div>
                  <div>Nb org.</div>
                  <div>Distance (km)</div>
                  <div>Nb A/R</div>
                  <div></div>
                </div>
                
                {formData.organizers.map((org, index) => (
                  <div key={index} className="grid grid-cols-5 gap-1">
                    <Select 
                      value={org.mode} 
                      onValueChange={(val) => handleOrganizerChange(index, 'mode', val)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Mode..." />
                      </SelectTrigger>
                      <SelectContent>
                        {TRANSPORT_MODES.map(mode => (
                          <SelectItem key={mode.id} value={mode.id}>{mode.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="0"
                      value={org.count || ''}
                      onChange={(e) => handleOrganizerChange(index, 'count', parseInt(e.target.value) || 0)}
                      className="h-8 text-xs"
                      placeholder="0"
                    />
                    <Input
                      type="number"
                      min="0"
                      value={org.distance || ''}
                      onChange={(e) => handleOrganizerChange(index, 'distance', parseFloat(e.target.value) || 0)}
                      className="h-8 text-xs"
                      placeholder="0"
                    />
                    <Input
                      type="number"
                      min="0"
                      value={org.trips || ''}
                      onChange={(e) => handleOrganizerChange(index, 'trips', parseInt(e.target.value) || 0)}
                      className="h-8 text-xs"
                      placeholder="0"
                    />
                    <div className="h-8 flex items-center text-xs text-[#0d5f4d] font-medium bg-gray-50 rounded px-1">
                      {calculatedEmissions.organizers_emissions[index]?.toFixed(1) || 0}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ===== COLONNE DROITE - PARAMETRES CALCULES ===== */}
        <Card className="border-2 border-[#0d5f4d] shadow-lg">
          <CardHeader className="bg-[#f0f7f5] py-3 border-b border-[#0d5f4d]">
            <CardTitle className="flex items-center gap-2 text-lg text-[#0d5f4d]" style={{ fontFamily: 'Manrope, sans-serif' }}>
              <Calculator className="h-5 w-5" />
              3. Transport - Émissions calculées
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {/* 3.1. Visiteurs */}
            <h4 className="text-sm font-semibold text-[#0d5f4d] mb-2">3.1. Transport des visiteurs</h4>
            
            <div className="space-y-1 mb-4">
              <div className="grid grid-cols-12 gap-2 py-1 px-2 hover:bg-gray-50 text-sm">
                <div className="col-span-7">Visiteurs étrangers (accès IDF)</div>
                <div className="col-span-3 text-right font-bold text-[#0d5f4d]">
                  {calculatedEmissions.visitors_foreign_access.toFixed(1)}
                </div>
                <div className="col-span-2 text-gray-600">kgCO2e</div>
              </div>
              <div className="grid grid-cols-12 gap-2 py-1 px-2 hover:bg-gray-50 text-sm">
                <div className="col-span-7">Visiteurs nationaux non IDF (accès)</div>
                <div className="col-span-3 text-right font-bold text-[#0d5f4d]">
                  {calculatedEmissions.visitors_national_access.toFixed(1)}
                </div>
                <div className="col-span-2 text-gray-600">kgCO2e</div>
              </div>
              <div className="grid grid-cols-12 gap-2 py-1 px-2 hover:bg-gray-50 text-sm">
                <div className="col-span-7">Transport local étrangers</div>
                <div className="col-span-3 text-right font-bold text-[#0d5f4d]">
                  {calculatedEmissions.visitors_local_foreign.toFixed(1)}
                </div>
                <div className="col-span-2 text-gray-600">kgCO2e</div>
              </div>
              <div className="grid grid-cols-12 gap-2 py-1 px-2 hover:bg-gray-50 text-sm">
                <div className="col-span-7">Transport local nationaux non IDF</div>
                <div className="col-span-3 text-right font-bold text-[#0d5f4d]">
                  {calculatedEmissions.visitors_local_national.toFixed(1)}
                </div>
                <div className="col-span-2 text-gray-600">kgCO2e</div>
              </div>
              <div className="grid grid-cols-12 gap-2 py-1 px-2 hover:bg-gray-50 text-sm">
                <div className="col-span-7">Transport local franciliens</div>
                <div className="col-span-3 text-right font-bold text-[#0d5f4d]">
                  {calculatedEmissions.visitors_local_idf.toFixed(1)}
                </div>
                <div className="col-span-2 text-gray-600">kgCO2e</div>
              </div>
              <div className="grid grid-cols-12 gap-2 py-2 px-2 bg-[#f0f7f5] rounded text-sm">
                <div className="col-span-7 font-semibold">Total visiteurs</div>
                <div className="col-span-3 text-right font-bold text-[#0d5f4d]">
                  {calculatedEmissions.visitors_total.toFixed(1)}
                </div>
                <div className="col-span-2 text-gray-600">kgCO2e</div>
              </div>
            </div>

            {/* 3.2. Exposants */}
            <h4 className="text-sm font-semibold text-[#0d5f4d] mb-2">3.2. Transport des exposants/sportifs/artistes</h4>
            
            <div className="space-y-1 mb-4">
              <div className="grid grid-cols-12 gap-2 py-1 px-2 hover:bg-gray-50 text-sm">
                <div className="col-span-7">Étrangers (accès IDF)</div>
                <div className="col-span-3 text-right font-bold text-[#0d5f4d]">
                  {calculatedEmissions.exhibitors_foreign_access.toFixed(1)}
                </div>
                <div className="col-span-2 text-gray-600">kgCO2e</div>
              </div>
              <div className="grid grid-cols-12 gap-2 py-1 px-2 hover:bg-gray-50 text-sm">
                <div className="col-span-7">Nationaux non IDF (accès)</div>
                <div className="col-span-3 text-right font-bold text-[#0d5f4d]">
                  {calculatedEmissions.exhibitors_national_access.toFixed(1)}
                </div>
                <div className="col-span-2 text-gray-600">kgCO2e</div>
              </div>
              <div className="grid grid-cols-12 gap-2 py-1 px-2 hover:bg-gray-50 text-sm">
                <div className="col-span-7">Transport local étrangers</div>
                <div className="col-span-3 text-right font-bold text-[#0d5f4d]">
                  {calculatedEmissions.exhibitors_local_foreign.toFixed(1)}
                </div>
                <div className="col-span-2 text-gray-600">kgCO2e</div>
              </div>
              <div className="grid grid-cols-12 gap-2 py-1 px-2 hover:bg-gray-50 text-sm">
                <div className="col-span-7">Transport local nationaux non IDF</div>
                <div className="col-span-3 text-right font-bold text-[#0d5f4d]">
                  {calculatedEmissions.exhibitors_local_national.toFixed(1)}
                </div>
                <div className="col-span-2 text-gray-600">kgCO2e</div>
              </div>
              <div className="grid grid-cols-12 gap-2 py-1 px-2 hover:bg-gray-50 text-sm">
                <div className="col-span-7">Transport local franciliens</div>
                <div className="col-span-3 text-right font-bold text-[#0d5f4d]">
                  {calculatedEmissions.exhibitors_local_idf.toFixed(1)}
                </div>
                <div className="col-span-2 text-gray-600">kgCO2e</div>
              </div>
              <div className="grid grid-cols-12 gap-2 py-2 px-2 bg-[#f0f7f5] rounded text-sm">
                <div className="col-span-7 font-semibold">Total exposants</div>
                <div className="col-span-3 text-right font-bold text-[#0d5f4d]">
                  {calculatedEmissions.exhibitors_total.toFixed(1)}
                </div>
                <div className="col-span-2 text-gray-600">kgCO2e</div>
              </div>
            </div>

            {/* 3.3. Organisateurs */}
            <h4 className="text-sm font-semibold text-[#0d5f4d] mb-2">3.3. Transport des organisateurs</h4>
            
            <div className="space-y-1 mb-4">
              <div className="grid grid-cols-12 gap-2 py-2 px-2 bg-[#f0f7f5] rounded text-sm">
                <div className="col-span-7 font-semibold">Total organisateurs</div>
                <div className="col-span-3 text-right font-bold text-[#0d5f4d]">
                  {calculatedEmissions.organizers_total.toFixed(1)}
                </div>
                <div className="col-span-2 text-gray-600">kgCO2e</div>
              </div>
            </div>

            {/* Total */}
            <div className="border-t-2 border-[#0d5f4d] pt-3">
              <div className="grid grid-cols-12 gap-2 py-3 px-2 bg-[#e8f5f0] rounded text-sm">
                <div className="col-span-7 font-bold">TOTAL TRANSPORT</div>
                <div className="col-span-3 text-right font-bold text-[#0d5f4d] text-lg">
                  {calculatedEmissions.total.toFixed(1)}
                </div>
                <div className="col-span-2 text-gray-600">kgCO2e</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bouton de sauvegarde */}
      {onSave && (
        <div className="mt-6 flex justify-center">
          <Button
            data-testid="save-transport-btn"
            onClick={handleSave}
            className="bg-[#0d5f4d] hover:bg-[#0a4a3d] text-white px-8 py-3 text-base"
          >
            Enregistrer la section Transport
          </Button>
        </div>
      )}
    </div>
  );
};

export default TransportSection;
