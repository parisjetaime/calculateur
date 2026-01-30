import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone, Calculator, FileText, Monitor, Video } from "lucide-react";

// Supports papier (kgCO2e/kg papier)
const PAPER_FACTOR = 0.919;

// Supports numériques (kgCO2e/unité)
const DIGITAL_SUPPORTS = {
  "Email": 0.004,
  "Publication réseaux sociaux": 0.01,
  "Newsletter": 0.02,
};

// Streaming (kgCO2e/heure)
const STREAMING_FACTORS = {
  "Ordinateur portable ou télévision": 0.036,
  "Smartphone": 0.014,
};

// Ratio monétaire communication (kgCO2/k€)
const COMMUNICATION_RATIO = 340;

const CommunicationSection = ({ onSave, initialData, calculatedValues }) => {
  const [formData, setFormData] = useState({
    knows_communication: "Oui",
    
    // 8.1. Approche par les quantités
    paper_supports: [
      { type: "Flyer A5", quantity: 0, mass_per_unit: 0.005 },
      { type: "Affiche A3", quantity: 0, mass_per_unit: 0.020 },
      { type: "Programme A4", quantity: 0, mass_per_unit: 0.050 },
      { type: "Brochure", quantity: 0, mass_per_unit: 0.100 },
    ],
    kakemonos: 0,
    
    digital_supports: [
      { type: "Email", quantity: 0 },
      { type: "Publication réseaux sociaux", quantity: 0 },
      { type: "Newsletter", quantity: 0 },
    ],
    
    streaming: [
      { device: "Ordinateur portable ou télévision", duration_min: 0, audience: 0, videos: 0 },
      { device: "Smartphone", duration_min: 0, audience: 0, videos: 0 },
    ],
    
    // 8.2. Approche par les dépenses
    communication_expenses: [
      { type: "Activités créatives, artistiques", amount: 0 },
      { type: "Courrier", amount: 0 },
      { type: "Films, TV et radio", amount: 0 },
      { type: "Édition", amount: 0 },
    ],
    
    ...initialData,
  });

  const [calculatedEmissions, setCalculatedEmissions] = useState({
    paper_total: 0,
    kakemonos_total: 0,
    digital_total: 0,
    streaming_total: 0,
    physical_total: 0,
    virtual_total: 0,
    expenses_total: 0,
    total: 0,
  });

  const getOrientationMessage = () => {
    if (formData.knows_communication === "Oui") {
      return "Remplir l'onglet 8.1. Approche par les quantités";
    }
    return "Des valeurs moyennes vont être utilisées. Allez directement à l'onglet 9. Fret";
  };

  const calculateEmissions = useCallback(() => {
    // Supports papier
    const paperTotal = formData.paper_supports.reduce((sum, p) => 
      sum + (p.quantity * p.mass_per_unit * PAPER_FACTOR), 0);
    
    // Kakémonos (simplifié)
    const kakemonosTotal = formData.kakemonos * 2.5; // kgCO2e/kakémono
    
    // Supports numériques
    const digitalTotal = formData.digital_supports.reduce((sum, d) => {
      const factor = DIGITAL_SUPPORTS[d.type] || 0;
      return sum + (d.quantity * factor);
    }, 0);
    
    // Streaming
    const streamingTotal = formData.streaming.reduce((sum, s) => {
      const factor = STREAMING_FACTORS[s.device] || 0;
      return sum + ((s.duration_min / 60) * s.audience * s.videos * factor);
    }, 0);
    
    const physicalTotal = paperTotal + kakemonosTotal;
    const virtualTotal = digitalTotal + streamingTotal;
    
    // Dépenses
    const expensesTotal = formData.communication_expenses.reduce((sum, e) => 
      sum + (e.amount * COMMUNICATION_RATIO / 1000), 0);
    
    const total = formData.knows_communication === "Oui" 
      ? physicalTotal + virtualTotal 
      : expensesTotal;

    setCalculatedEmissions({
      paper_total: paperTotal,
      kakemonos_total: kakemonosTotal,
      digital_total: digitalTotal,
      streaming_total: streamingTotal,
      physical_total: physicalTotal,
      virtual_total: virtualTotal,
      expenses_total: expensesTotal,
      total,
    });
  }, [formData]);

  useEffect(() => {
    calculateEmissions();
  }, [calculateEmissions]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (arrayName, index, field, value) => {
    const newArray = [...formData[arrayName]];
    newArray[index] = { ...newArray[index], [field]: parseFloat(value) || 0 };
    setFormData(prev => ({ ...prev, [arrayName]: newArray }));
  };

  const handleSave = () => {
    if (onSave) {
      onSave({ ...formData, total_emissions: calculatedEmissions.total });
    }
  };

  const showQuantities = formData.knows_communication === "Oui";

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-2 border-[#0d5f4d] shadow-lg">
          <CardHeader className="bg-[#0d5f4d] text-white py-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Megaphone className="h-5 w-5" />
              8. Communication - Saisie
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-3 gap-2 items-center">
              <Label className="text-sm">Je connais les types de biens et services</Label>
              <div className="col-span-2">
                <Select value={formData.knows_communication} onValueChange={(val) => handleChange('knows_communication', val)}>
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

            {showQuantities && (
              <>
                {/* Supports papier */}
                <div className="border-t pt-3">
                  <h4 className="text-sm font-semibold text-[#0d5f4d] mb-2">8.1. Approche par les quantités</h4>
                  <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                    <FileText className="h-3 w-3" /> Supports en papier
                  </p>
                  {formData.paper_supports.map((p, i) => (
                    <div key={i} className="grid grid-cols-3 gap-2 items-center mb-2">
                      <Label className="text-xs">{p.type}</Label>
                      <Input
                        type="number" min="0"
                        value={p.quantity || ''}
                        onChange={(e) => handleArrayChange('paper_supports', i, 'quantity', e.target.value)}
                        className="h-8 text-sm"
                      />
                      <span className="text-xs text-gray-500">unités</span>
                    </div>
                  ))}
                  <div className="grid grid-cols-3 gap-2 items-center mb-2">
                    <Label className="text-xs">Kakémonos</Label>
                    <Input
                      type="number" min="0"
                      value={formData.kakemonos || ''}
                      onChange={(e) => handleChange('kakemonos', parseInt(e.target.value) || 0)}
                      className="h-8 text-sm"
                    />
                    <span className="text-xs text-gray-500">unités</span>
                  </div>
                </div>

                {/* Supports numériques */}
                <div className="border-t pt-3">
                  <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                    <Monitor className="h-3 w-3" /> Supports numériques
                  </p>
                  {formData.digital_supports.map((d, i) => (
                    <div key={i} className="grid grid-cols-3 gap-2 items-center mb-2">
                      <Label className="text-xs">{d.type}</Label>
                      <Input
                        type="number" min="0"
                        value={d.quantity || ''}
                        onChange={(e) => handleArrayChange('digital_supports', i, 'quantity', e.target.value)}
                        className="h-8 text-sm"
                      />
                      <span className="text-xs text-gray-500">unités</span>
                    </div>
                  ))}
                </div>

                {/* Streaming */}
                <div className="border-t pt-3">
                  <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                    <Video className="h-3 w-3" /> Streaming vidéo
                  </p>
                  {formData.streaming.map((s, i) => (
                    <div key={i} className="grid grid-cols-5 gap-1 items-center mb-2">
                      <Label className="text-xs col-span-1">{s.device === "Smartphone" ? "📱" : "💻"}</Label>
                      <Input
                        type="number" min="0" placeholder="Min"
                        value={s.duration_min || ''}
                        onChange={(e) => handleArrayChange('streaming', i, 'duration_min', e.target.value)}
                        className="h-8 text-xs"
                      />
                      <Input
                        type="number" min="0" placeholder="Audience"
                        value={s.audience || ''}
                        onChange={(e) => handleArrayChange('streaming', i, 'audience', e.target.value)}
                        className="h-8 text-xs"
                      />
                      <Input
                        type="number" min="0" placeholder="Vidéos"
                        value={s.videos || ''}
                        onChange={(e) => handleArrayChange('streaming', i, 'videos', e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 border-[#0d5f4d] shadow-lg">
          <CardHeader className="bg-[#f0f7f5] py-3 border-b border-[#0d5f4d]">
            <CardTitle className="flex items-center gap-2 text-lg text-[#0d5f4d]">
              <Calculator className="h-5 w-5" />
              8. Communication - Émissions calculées
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {showQuantities && (
              <>
                <h4 className="text-sm font-semibold text-[#0d5f4d] mb-2">Supports physiques</h4>
                <div className="space-y-1 mb-4">
                  <div className="grid grid-cols-12 gap-2 py-1 px-2 text-sm">
                    <div className="col-span-7">Supports papier</div>
                    <div className="col-span-3 text-right font-bold text-[#0d5f4d]">{calculatedEmissions.paper_total.toFixed(1)}</div>
                    <div className="col-span-2 text-gray-600">kgCO2e</div>
                  </div>
                  <div className="grid grid-cols-12 gap-2 py-1 px-2 text-sm">
                    <div className="col-span-7">Kakémonos</div>
                    <div className="col-span-3 text-right font-bold text-[#0d5f4d]">{calculatedEmissions.kakemonos_total.toFixed(1)}</div>
                    <div className="col-span-2 text-gray-600">kgCO2e</div>
                  </div>
                  <div className="grid grid-cols-12 gap-2 py-2 px-2 bg-[#f0f7f5] rounded text-sm">
                    <div className="col-span-7 font-semibold">Total physiques</div>
                    <div className="col-span-3 text-right font-bold text-[#0d5f4d]">{calculatedEmissions.physical_total.toFixed(1)}</div>
                    <div className="col-span-2 text-gray-600">kgCO2e</div>
                  </div>
                </div>

                <h4 className="text-sm font-semibold text-[#0d5f4d] mb-2">Supports numériques</h4>
                <div className="space-y-1 mb-4">
                  <div className="grid grid-cols-12 gap-2 py-1 px-2 text-sm">
                    <div className="col-span-7">Digital</div>
                    <div className="col-span-3 text-right font-bold text-[#0d5f4d]">{calculatedEmissions.digital_total.toFixed(1)}</div>
                    <div className="col-span-2 text-gray-600">kgCO2e</div>
                  </div>
                  <div className="grid grid-cols-12 gap-2 py-1 px-2 text-sm">
                    <div className="col-span-7">Streaming</div>
                    <div className="col-span-3 text-right font-bold text-[#0d5f4d]">{calculatedEmissions.streaming_total.toFixed(1)}</div>
                    <div className="col-span-2 text-gray-600">kgCO2e</div>
                  </div>
                  <div className="grid grid-cols-12 gap-2 py-2 px-2 bg-[#f0f7f5] rounded text-sm">
                    <div className="col-span-7 font-semibold">Total virtuels</div>
                    <div className="col-span-3 text-right font-bold text-[#0d5f4d]">{calculatedEmissions.virtual_total.toFixed(1)}</div>
                    <div className="col-span-2 text-gray-600">kgCO2e</div>
                  </div>
                </div>
              </>
            )}

            <div className="border-t-2 border-[#0d5f4d] pt-3">
              <div className="grid grid-cols-12 gap-2 py-3 px-2 bg-[#e8f5f0] rounded">
                <div className="col-span-7 font-bold">TOTAL COMMUNICATION</div>
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
            Enregistrer la section Communication
          </Button>
        </div>
      )}
    </div>
  );
};

export default CommunicationSection;
