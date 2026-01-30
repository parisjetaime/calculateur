import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift, Calculator, Tag } from "lucide-react";

// Catégories de goodies et ratios monétaires (source: hypotheses/achats_goodies)
const GOODIE_CATEGORIES = [
  { id: "produit_agroalimentaire", label: "Produit agroalimentaire", ratio: 1500 },
  { id: "article_bois", label: "Article en bois", ratio: 890 },
  { id: "petite_fourniture", label: "Petite fourniture", ratio: 650 },
  { id: "objet_plastique", label: "Objet en plastiques et caoutchouc", ratio: 2200 },
  { id: "textile", label: "Textile (vêtements, sacs)", ratio: 1800 },
  { id: "electronique", label: "Électronique", ratio: 3500 },
];

// Types de badges
const BADGE_TYPES = [
  { id: "plastique_souple", label: "Plastique souple", factor: 0.025 },
  { id: "plastique_rigide", label: "Plastique rigide", factor: 0.045 },
  { id: "papier", label: "Papier/Carton", factor: 0.015 },
];

// Équipements sportifs
const SPORT_EQUIPMENT = [
  { id: "pince_nez", label: "Natation, pince nez", factor: 0.15 },
  { id: "genouilleres", label: "Volley, genouillères", factor: 0.85 },
  { id: "chaussettes", label: "Chaussettes", factor: 0.35 },
  { id: "maillot", label: "Maillot", factor: 1.2 },
];

const PurchasesSection = ({ onSave, initialData, eventData, calculatedValues }) => {
  const [formData, setFormData] = useState({
    // 7.1 Goodies
    knows_goodie_expenses: "Non",
    goodie_items: [
      { category: "", expense_per_visitor: 0 },
      { category: "", expense_per_visitor: 0 },
      { category: "", expense_per_visitor: 0 },
    ],
    
    // 7.2 Badges
    badges_visitors: "Non",
    badges_exhibitors: "Non",
    badges_organizers: "Non",
    badge_type_visitors: "",
    badge_type_exhibitors: "",
    badge_type_organizers: "",
    badges_reused: "Non",
    
    // 7.3 Équipements sportifs
    sport_equipment: [
      { type: "", quantity: 0 },
      { type: "", quantity: 0 },
    ],
    
    ...initialData,
  });

  const [calculatedEmissions, setCalculatedEmissions] = useState({
    goodie_emissions: [],
    total_goodies: 0,
    badge_visitors_emissions: 0,
    badge_exhibitors_emissions: 0,
    badge_organizers_emissions: 0,
    total_badges: 0,
    sport_emissions: [],
    total_sport: 0,
    total: 0,
  });

  const visitorsCount = calculatedValues?.visitors_foreign + calculatedValues?.visitors_national_non_idf + calculatedValues?.visitors_idf || 0;
  const exhibitorsCount = calculatedValues?.total_exhibitors || 0;

  const getOrientationMessage = () => {
    if (formData.knows_goodie_expenses === "Oui") {
      return "Remplir l'onglet 7.1.1. Approche par les dépenses par catégorie";
    }
    return "Des valeurs moyennes vont être utilisées. Allez directement à l'onglet 7.2. Les badges";
  };

  const calculateEmissions = useCallback(() => {
    // 7.1 Goodies
    const goodieEmissions = formData.goodie_items.map(item => {
      if (!item.category || !item.expense_per_visitor) return 0;
      const category = GOODIE_CATEGORIES.find(c => c.id === item.category);
      if (!category) return 0;
      return (item.expense_per_visitor * category.ratio / 1000) * visitorsCount;
    });
    const totalGoodies = goodieEmissions.reduce((sum, e) => sum + e, 0);

    // 7.2 Badges
    let badgeVisitorsEmissions = 0;
    let badgeExhibitorsEmissions = 0;
    let badgeOrganizersEmissions = 0;

    if (formData.badges_visitors === "Oui" && formData.badge_type_visitors && formData.badges_reused === "Non") {
      const badgeType = BADGE_TYPES.find(b => b.id === formData.badge_type_visitors);
      if (badgeType) {
        badgeVisitorsEmissions = visitorsCount * badgeType.factor;
      }
    }

    if (formData.badges_exhibitors === "Oui" && formData.badge_type_exhibitors && formData.badges_reused === "Non") {
      const badgeType = BADGE_TYPES.find(b => b.id === formData.badge_type_exhibitors);
      if (badgeType) {
        badgeExhibitorsEmissions = exhibitorsCount * badgeType.factor;
      }
    }

    const totalBadges = badgeVisitorsEmissions + badgeExhibitorsEmissions + badgeOrganizersEmissions;

    // 7.3 Équipements sportifs
    const sportEmissions = formData.sport_equipment.map(item => {
      if (!item.type || !item.quantity) return 0;
      const equipment = SPORT_EQUIPMENT.find(e => e.id === item.type);
      if (!equipment) return 0;
      return item.quantity * equipment.factor;
    });
    const totalSport = sportEmissions.reduce((sum, e) => sum + e, 0);

    const total = totalGoodies + totalBadges + totalSport;

    setCalculatedEmissions({
      goodie_emissions: goodieEmissions,
      total_goodies: totalGoodies,
      badge_visitors_emissions: badgeVisitorsEmissions,
      badge_exhibitors_emissions: badgeExhibitorsEmissions,
      badge_organizers_emissions: badgeOrganizersEmissions,
      total_badges: totalBadges,
      sport_emissions: sportEmissions,
      total_sport: totalSport,
      total,
    });
  }, [formData, visitorsCount, exhibitorsCount]);

  useEffect(() => {
    calculateEmissions();
  }, [calculateEmissions]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGoodieChange = (index, field, value) => {
    const newItems = [...formData.goodie_items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData(prev => ({ ...prev, goodie_items: newItems }));
  };

  const handleSportChange = (index, field, value) => {
    const newItems = [...formData.sport_equipment];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData(prev => ({ ...prev, sport_equipment: newItems }));
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
        {/* COLONNE GAUCHE - SAISIE */}
        <Card className="border-2 border-[#0d5f4d] shadow-lg">
          <CardHeader className="bg-[#0d5f4d] text-white py-3">
            <CardTitle className="flex items-center gap-2 text-lg" style={{ fontFamily: 'Manrope, sans-serif' }}>
              <Gift className="h-5 w-5" />
              7. Achats et Goodies - Saisie
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {/* 7.1 Goodies */}
            <div className="border-b border-gray-200 pb-4">
              <h4 className="text-sm font-semibold text-[#0d5f4d] mb-3">7.1. Les goodies</h4>
              
              <div className="grid grid-cols-3 gap-2 items-center mb-3">
                <Label className="text-sm">Je connais les dépenses par catégorie</Label>
                <div className="col-span-2">
                  <Select 
                    value={formData.knows_goodie_expenses} 
                    onValueChange={(val) => handleChange('knows_goodie_expenses', val)}
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
                <p className="text-xs text-[#0d5f4d]">→ {getOrientationMessage()}</p>
              </div>

              {formData.knows_goodie_expenses === "Oui" && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-600">Dépenses par catégorie (€/visiteur)</p>
                  {formData.goodie_items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2">
                      <div className="col-span-7">
                        <Select 
                          value={item.category} 
                          onValueChange={(val) => handleGoodieChange(index, 'category', val)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Catégorie..." />
                          </SelectTrigger>
                          <SelectContent>
                            {GOODIE_CATEGORIES.map(cat => (
                              <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.expense_per_visitor || ''}
                          onChange={(e) => handleGoodieChange(index, 'expense_per_visitor', parseFloat(e.target.value) || 0)}
                          className="h-8 text-xs"
                          placeholder="€/visiteur"
                        />
                      </div>
                      <div className="col-span-2 text-xs text-gray-500 flex items-center">€</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 7.2 Badges */}
            <div className="border-b border-gray-200 pb-4">
              <h4 className="text-sm font-semibold text-[#0d5f4d] mb-3 flex items-center gap-2">
                <Tag className="h-4 w-4" />
                7.2. Les badges
              </h4>
              
              <div className="space-y-3">
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div></div>
                  <div className="text-center font-medium">Visiteurs</div>
                  <div className="text-center font-medium">Exposants</div>
                  <div className="text-center font-medium">Organisateurs</div>
                </div>
                
                <div className="grid grid-cols-4 gap-2 items-center">
                  <Label className="text-xs">Badges neufs ?</Label>
                  <Select value={formData.badges_visitors} onValueChange={(val) => handleChange('badges_visitors', val)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Oui">Oui</SelectItem>
                      <SelectItem value="Non">Non</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={formData.badges_exhibitors} onValueChange={(val) => handleChange('badges_exhibitors', val)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Oui">Oui</SelectItem>
                      <SelectItem value="Non">Non</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={formData.badges_organizers} onValueChange={(val) => handleChange('badges_organizers', val)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Oui">Oui</SelectItem>
                      <SelectItem value="Non">Non</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 gap-2 items-center">
                  <Label className="text-xs">Type de badge</Label>
                  <Select value={formData.badge_type_visitors} onValueChange={(val) => handleChange('badge_type_visitors', val)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="..." /></SelectTrigger>
                    <SelectContent>
                      {BADGE_TYPES.map(type => (
                        <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={formData.badge_type_exhibitors} onValueChange={(val) => handleChange('badge_type_exhibitors', val)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="..." /></SelectTrigger>
                    <SelectContent>
                      {BADGE_TYPES.map(type => (
                        <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={formData.badge_type_organizers} onValueChange={(val) => handleChange('badge_type_organizers', val)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="..." /></SelectTrigger>
                    <SelectContent>
                      {BADGE_TYPES.map(type => (
                        <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-2 items-center">
                  <Label className="text-sm">Badges réutilisés ?</Label>
                  <div className="col-span-2">
                    <Select value={formData.badges_reused} onValueChange={(val) => handleChange('badges_reused', val)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Oui">Oui</SelectItem>
                        <SelectItem value="Non">Non</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* 7.3 Équipements sportifs */}
            <div>
              <h4 className="text-sm font-semibold text-[#0d5f4d] mb-3">7.3. Achats de matériel sportif</h4>
              
              <div className="space-y-2">
                {formData.sport_equipment.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2">
                    <div className="col-span-7">
                      <Select 
                        value={item.type} 
                        onValueChange={(val) => handleSportChange(index, 'type', val)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Équipement..." />
                        </SelectTrigger>
                        <SelectContent>
                          {SPORT_EQUIPMENT.map(eq => (
                            <SelectItem key={eq.id} value={eq.id}>{eq.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        min="0"
                        value={item.quantity || ''}
                        onChange={(e) => handleSportChange(index, 'quantity', parseInt(e.target.value) || 0)}
                        className="h-8 text-xs"
                        placeholder="Qté"
                      />
                    </div>
                    <div className="col-span-2 text-xs text-gray-500 flex items-center">unités</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* COLONNE DROITE - CALCULS */}
        <Card className="border-2 border-[#0d5f4d] shadow-lg">
          <CardHeader className="bg-[#f0f7f5] py-3 border-b border-[#0d5f4d]">
            <CardTitle className="flex items-center gap-2 text-lg text-[#0d5f4d]" style={{ fontFamily: 'Manrope, sans-serif' }}>
              <Calculator className="h-5 w-5" />
              7. Achats - Émissions calculées
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <h4 className="text-sm font-semibold text-[#0d5f4d] mb-2">7.1. Goodies</h4>
            <div className="space-y-1 mb-4">
              <div className="grid grid-cols-12 gap-2 py-2 px-2 bg-[#f0f7f5] rounded text-sm">
                <div className="col-span-7 font-semibold">Total goodies</div>
                <div className="col-span-3 text-right font-bold text-[#0d5f4d]">
                  {calculatedEmissions.total_goodies.toFixed(1)}
                </div>
                <div className="col-span-2 text-gray-600">kgCO2e</div>
              </div>
            </div>

            <h4 className="text-sm font-semibold text-[#0d5f4d] mb-2">7.2. Badges</h4>
            <div className="space-y-1 mb-4">
              <div className="grid grid-cols-12 gap-2 py-1 px-2 hover:bg-gray-50 text-sm">
                <div className="col-span-7">Badges visiteurs</div>
                <div className="col-span-3 text-right font-bold text-[#0d5f4d]">
                  {calculatedEmissions.badge_visitors_emissions.toFixed(1)}
                </div>
                <div className="col-span-2 text-gray-600">kgCO2e</div>
              </div>
              <div className="grid grid-cols-12 gap-2 py-1 px-2 hover:bg-gray-50 text-sm">
                <div className="col-span-7">Badges exposants</div>
                <div className="col-span-3 text-right font-bold text-[#0d5f4d]">
                  {calculatedEmissions.badge_exhibitors_emissions.toFixed(1)}
                </div>
                <div className="col-span-2 text-gray-600">kgCO2e</div>
              </div>
              <div className="grid grid-cols-12 gap-2 py-2 px-2 bg-[#f0f7f5] rounded text-sm">
                <div className="col-span-7 font-semibold">Total badges</div>
                <div className="col-span-3 text-right font-bold text-[#0d5f4d]">
                  {calculatedEmissions.total_badges.toFixed(1)}
                </div>
                <div className="col-span-2 text-gray-600">kgCO2e</div>
              </div>
            </div>

            <h4 className="text-sm font-semibold text-[#0d5f4d] mb-2">7.3. Équipements sportifs</h4>
            <div className="space-y-1 mb-4">
              <div className="grid grid-cols-12 gap-2 py-2 px-2 bg-[#f0f7f5] rounded text-sm">
                <div className="col-span-7 font-semibold">Total équipements</div>
                <div className="col-span-3 text-right font-bold text-[#0d5f4d]">
                  {calculatedEmissions.total_sport.toFixed(1)}
                </div>
                <div className="col-span-2 text-gray-600">kgCO2e</div>
              </div>
            </div>

            <div className="border-t-2 border-[#0d5f4d] pt-3">
              <div className="grid grid-cols-12 gap-2 py-3 px-2 bg-[#e8f5f0] rounded text-sm">
                <div className="col-span-7 font-bold">TOTAL ACHATS</div>
                <div className="col-span-3 text-right font-bold text-[#0d5f4d] text-lg">
                  {calculatedEmissions.total.toFixed(1)}
                </div>
                <div className="col-span-2 text-gray-600">kgCO2e</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {onSave && (
        <div className="mt-6 flex justify-center">
          <Button
            data-testid="save-purchases-btn"
            onClick={handleSave}
            className="bg-[#0d5f4d] hover:bg-[#0a4a3d] text-white px-8 py-3 text-base"
          >
            Enregistrer la section Achats
          </Button>
        </div>
      )}
    </div>
  );
};

export default PurchasesSection;
