import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift, Calculator, BadgeCheck } from "lucide-react";

// Ratios monétaires goodies (kgCO2/k€)
const GOODIES_RATIOS = {
  "Produit agroalimentaire": 1200,
  "Article en bois": 400,
  "Petite fourniture": 600,
  "Objet en plastiques et caoutchouc": 2500,
  "Textile": 800,
  "Papeterie": 300,
};

// Facteurs badges (kgCO2e/badge)
const BADGE_FACTORS = {
  "Plastique souple": 0.025,
  "Plastique rigide": 0.035,
  "Carton": 0.015,
};

const PurchasesSection = ({ onSave, initialData, calculatedValues }) => {
  const [formData, setFormData] = useState({
    // 7.1. Goodies
    knows_goodies: "Non",
    goodies: [
      { type: "Produit agroalimentaire", amount_per_visitor: 0 },
      { type: "Article en bois", amount_per_visitor: 0 },
      { type: "Petite fourniture", amount_per_visitor: 0 },
      { type: "Objet en plastiques et caoutchouc", amount_per_visitor: 0 },
    ],
    
    // 7.2. Badges
    badges_visitors: "Non",
    badges_exhibitors: "Non",
    badges_organizers: "Non",
    badge_type_visitors: "",
    badge_type_exhibitors: "",
    badge_type_organizers: "",
    badges_reused: "Non",
    
    ...initialData,
  });

  const [calculatedEmissions, setCalculatedEmissions] = useState({
    goodies_total: 0,
    badges_visitors: 0,
    badges_exhibitors: 0,
    badges_organizers: 0,
    badges_total: 0,
    total: 0,
  });

  const totalVisitors = calculatedValues?.total_visitors || 0;
  const totalExhibitors = calculatedValues?.total_exhibitors || 0;

  const getOrientationMessage = () => {
    if (formData.knows_goodies === "Oui") {
      return "Remplir l'onglet 7.1.1. Approche par les dépenses par catégorie";
    }
    return "Des valeurs moyennes vont être utilisées. Allez directement à l'onglet 7.2. Les badges";
  };

  const calculateEmissions = useCallback(() => {
    // Goodies
    let goodiesTotal = 0;
    if (formData.knows_goodies === "Oui") {
      formData.goodies.forEach(g => {
        const ratio = GOODIES_RATIOS[g.type] || 0;
        goodiesTotal += (g.amount_per_visitor * ratio / 1000) * totalVisitors;
      });
    }
    
    // Badges
    let badgesVisitors = 0;
    let badgesExhibitors = 0;
    let badgesOrganizers = 0;
    
    if (formData.badges_visitors === "Oui" && formData.badge_type_visitors && formData.badges_reused === "Non") {
      const factor = BADGE_FACTORS[formData.badge_type_visitors] || 0;
      badgesVisitors = totalVisitors * factor;
    }
    if (formData.badges_exhibitors === "Oui" && formData.badge_type_exhibitors && formData.badges_reused === "Non") {
      const factor = BADGE_FACTORS[formData.badge_type_exhibitors] || 0;
      badgesExhibitors = totalExhibitors * factor;
    }
    
    const badgesTotal = badgesVisitors + badgesExhibitors + badgesOrganizers;
    const total = goodiesTotal + badgesTotal;

    setCalculatedEmissions({
      goodies_total: goodiesTotal,
      badges_visitors: badgesVisitors,
      badges_exhibitors: badgesExhibitors,
      badges_organizers: badgesOrganizers,
      badges_total: badgesTotal,
      total,
    });
  }, [formData, totalVisitors, totalExhibitors]);

  useEffect(() => {
    calculateEmissions();
  }, [calculateEmissions]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGoodieChange = (index, value) => {
    const newGoodies = [...formData.goodies];
    newGoodies[index].amount_per_visitor = parseFloat(value) || 0;
    setFormData(prev => ({ ...prev, goodies: newGoodies }));
  };

  const handleSave = () => {
    if (onSave) {
      onSave({ ...formData, total_emissions: calculatedEmissions.total });
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-2 border-[#0d5f4d] shadow-lg">
          <CardHeader className="bg-[#0d5f4d] text-white py-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gift className="h-5 w-5" />
              7. Achats et goodies - Saisie
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {/* 7.1. Goodies */}
            <h4 className="text-sm font-semibold text-[#0d5f4d]">7.1. Les goodies</h4>
            <div className="grid grid-cols-3 gap-2 items-center">
              <Label className="text-sm">Je connais les dépenses en goodies</Label>
              <div className="col-span-2">
                <Select value={formData.knows_goodies} onValueChange={(val) => handleChange('knows_goodies', val)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Oui">Oui</SelectItem>
                    <SelectItem value="Non">Non</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="bg-[#f0f7f5] border border-[#0d5f4d] rounded-lg p-2">
              <p className="text-xs text-[#0d5f4d]">→ {getOrientationMessage()}</p>
            </div>

            {formData.knows_goodies === "Oui" && (
              <div className="border-t pt-3">
                <p className="text-xs text-gray-600 mb-2">Dépense (€/visiteur)</p>
                {formData.goodies.map((g, i) => (
                  <div key={i} className="grid grid-cols-3 gap-2 items-center mb-2">
                    <Label className="text-xs">{g.type}</Label>
                    <Input
                      type="number" min="0" step="0.01"
                      value={g.amount_per_visitor || ''}
                      onChange={(e) => handleGoodieChange(i, e.target.value)}
                      className="h-8 text-sm"
                    />
                    <span className="text-xs text-gray-500">€/visiteur</span>
                  </div>
                ))}
              </div>
            )}

            {/* 7.2. Badges */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-[#0d5f4d] mb-3 flex items-center gap-1">
                <BadgeCheck className="h-4 w-4" /> 7.2. Les badges
              </h4>
              
              <p className="text-xs text-gray-600 mb-2">Des badges neufs seront-ils fournis ?</p>
              <div className="grid grid-cols-4 gap-2 mb-3">
                <Label className="text-xs">Aux visiteurs</Label>
                <Select value={formData.badges_visitors} onValueChange={(val) => handleChange('badges_visitors', val)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Oui">Oui</SelectItem>
                    <SelectItem value="Non">Non</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={formData.badge_type_visitors} onValueChange={(val) => handleChange('badge_type_visitors', val)}>
                  <SelectTrigger className="h-8 text-xs col-span-2"><SelectValue placeholder="Type..." /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(BADGE_FACTORS).map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 gap-2 mb-3">
                <Label className="text-xs">Aux exposants</Label>
                <Select value={formData.badges_exhibitors} onValueChange={(val) => handleChange('badges_exhibitors', val)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Oui">Oui</SelectItem>
                    <SelectItem value="Non">Non</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={formData.badge_type_exhibitors} onValueChange={(val) => handleChange('badge_type_exhibitors', val)}>
                  <SelectTrigger className="h-8 text-xs col-span-2"><SelectValue placeholder="Type..." /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(BADGE_FACTORS).map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-3 gap-2 items-center">
                <Label className="text-xs">Les badges seront réutilisés</Label>
                <Select value={formData.badges_reused} onValueChange={(val) => handleChange('badges_reused', val)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Oui">Oui</SelectItem>
                    <SelectItem value="Non">Non</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-[#0d5f4d] shadow-lg">
          <CardHeader className="bg-[#f0f7f5] py-3 border-b border-[#0d5f4d]">
            <CardTitle className="flex items-center gap-2 text-lg text-[#0d5f4d]">
              <Calculator className="h-5 w-5" />
              7. Achats - Émissions calculées
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-1 mb-4">
              <div className="grid grid-cols-12 gap-2 py-2 px-2 text-sm">
                <div className="col-span-7">Total goodies</div>
                <div className="col-span-3 text-right font-bold text-[#0d5f4d]">{calculatedEmissions.goodies_total.toFixed(1)}</div>
                <div className="col-span-2 text-gray-600">kgCO2e</div>
              </div>
              <div className="grid grid-cols-12 gap-2 py-2 px-2 text-sm">
                <div className="col-span-7">Badges visiteurs</div>
                <div className="col-span-3 text-right font-bold text-[#0d5f4d]">{calculatedEmissions.badges_visitors.toFixed(1)}</div>
                <div className="col-span-2 text-gray-600">kgCO2e</div>
              </div>
              <div className="grid grid-cols-12 gap-2 py-2 px-2 text-sm">
                <div className="col-span-7">Badges exposants</div>
                <div className="col-span-3 text-right font-bold text-[#0d5f4d]">{calculatedEmissions.badges_exhibitors.toFixed(1)}</div>
                <div className="col-span-2 text-gray-600">kgCO2e</div>
              </div>
              <div className="grid grid-cols-12 gap-2 py-2 px-2 bg-[#f0f7f5] rounded text-sm">
                <div className="col-span-7 font-semibold">Total badges</div>
                <div className="col-span-3 text-right font-bold text-[#0d5f4d]">{calculatedEmissions.badges_total.toFixed(1)}</div>
                <div className="col-span-2 text-gray-600">kgCO2e</div>
              </div>
            </div>

            <div className="border-t-2 border-[#0d5f4d] pt-3">
              <div className="grid grid-cols-12 gap-2 py-3 px-2 bg-[#e8f5f0] rounded">
                <div className="col-span-7 font-bold">TOTAL ACHATS</div>
                <div className="col-span-3 text-right font-bold text-[#0d5f4d] text-lg">{calculatedEmissions.total.toFixed(1)}</div>
                <div className="col-span-2 text-gray-600">kgCO2e</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {onSave && (
        <div className="mt-6 flex justify-center">
          <Button onClick={handleSave} className="bg-[#0d5f4d] hover:bg-[#0a4a3d] text-white px-8 py-3">
            Enregistrer la section Achats
          </Button>
        </div>
      )}
    </div>
  );
};

export default PurchasesSection;
