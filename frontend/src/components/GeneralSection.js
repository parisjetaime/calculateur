import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const GeneralSection = ({ onNext, initialData }) => {
  const [formData, setFormData] = useState({
    event_name: "",
    event_type: "Evenement_culturel",
    event_subtype: "",
    event_duration_days: 1,
    start_date: "",
    end_date: "",
    total_visitors: 0,
    visitors_foreign_pct: 0,
    visitors_idf_pct: 0,
    unknown_foreign_rate: false,
    unknown_idf_rate: false,
    exhibiting_organizations: 0,
    organizations_foreign_pct: 0,
    organizations_idf_pct: 0,
    unknown_organizations_foreign_rate: false,
    unknown_organizations_idf_rate: false,
    athletes_artists_count: 0,
    athletes_artists_foreign_pct: 0,
    athletes_artists_idf_pct: 0,
    organizers_count: 0,
    ...initialData,
  });

  const [calculatedValues, setCalculatedValues] = useState(null);
  const [loading, setLoading] = useState(false);

  // Prévisualiser les calculs en temps réel
  useEffect(() => {
    const debounceTimer = setTimeout(async () => {
      try {
        const response = await axios.post(`${API}/events/preview`, formData);
        setCalculatedValues(response.data);
      } catch (error) {
        console.error("Erreur prévisualisation:", error);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [formData]);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/events`, formData);
      onNext(response.data);
    } catch (error) {
      console.error("Erreur création événement:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Colonne gauche - Saisie */}
        <Card className="border-2 border-[#0d5f4d] shadow-lg">
          <CardHeader className="bg-[#0d5f4d] text-white">
            <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              <Leaf className="h-5 w-5" />
              1. Général - Saisie
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label>Nom de l'événement *</Label>
              <Input
                value={formData.event_name}
                onChange={(e) => handleChange('event_name', e.target.value)}
                placeholder="Ex: Paris Event"
                className="mt-2"
              />
            </div>

            <div>
              <Label>Type d'événement</Label>
              <Select value={formData.event_type} onValueChange={(val) => handleChange('event_type', val)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Evenement_culturel">Événement culturel</SelectItem>
                  <SelectItem value="Evenement_professionnel">Événement professionnel</SelectItem>
                  <SelectItem value="Evenement_sportif">Événement sportif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Nombre de visiteurs</Label>
              <Input
                type="number"
                value={formData.total_visitors}
                onChange={(e) => handleChange('total_visitors', parseInt(e.target.value) || 0)}
                className="mt-2"
              />
            </div>

            <div>
              <Label>% visiteurs étrangers</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.visitors_foreign_pct}
                onChange={(e) => handleChange('visitors_foreign_pct', parseFloat(e.target.value) || 0)}
                disabled={formData.unknown_foreign_rate}
                className="mt-2"
              />
              <div className="flex items-center gap-2 mt-2">
                <Checkbox
                  checked={formData.unknown_foreign_rate}
                  onCheckedChange={(checked) => handleChange('unknown_foreign_rate', checked)}
                />
                <Label className="text-sm">Je ne connais pas le taux</Label>
              </div>
            </div>

            <div>
              <Label>% visiteurs franciliens</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.visitors_idf_pct}
                onChange={(e) => handleChange('visitors_idf_pct', parseFloat(e.target.value) || 0)}
                disabled={formData.unknown_idf_rate}
                className="mt-2"
              />
              <div className="flex items-center gap-2 mt-2">
                <Checkbox
                  checked={formData.unknown_idf_rate}
                  onCheckedChange={(checked) => handleChange('unknown_idf_rate', checked)}
                />
                <Label className="text-sm">Je ne connais pas le taux</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Colonne droite - Calculs */}
        <Card className="border-2 border-[#0d5f4d] shadow-lg">
          <CardHeader className="bg-[#f0f7f5]">
            <CardTitle className="text-[#0d5f4d]">Paramètres calculés</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {calculatedValues ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-sm font-semibold border-b pb-2">
                  <div>Paramètre</div>
                  <div className="text-right">Valeur</div>
                  <div>Unité</div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-sm py-1">
                  <div>Visiteurs étrangers</div>
                  <div className="text-right font-bold text-[#0d5f4d]">{calculatedValues.calculated_visitors_foreign || 0}</div>
                  <div className="text-gray-600">pers.</div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-sm py-1">
                  <div>Visiteurs nationaux</div>
                  <div className="text-right font-bold text-[#0d5f4d]">{calculatedValues.calculated_visitors_national_non_idf || 0}</div>
                  <div className="text-gray-600">pers.</div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-sm py-1">
                  <div>Visiteurs IDF</div>
                  <div className="text-right font-bold text-[#0d5f4d]">{calculatedValues.calculated_visitors_idf || 0}</div>
                  <div className="text-gray-600">pers.</div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Saisissez les données
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 flex justify-center">
        <Button
          onClick={handleSubmit}
          disabled={loading || !formData.event_name}
          className="bg-[#0d5f4d] hover:bg-[#0a4a3d] text-white px-12 py-6 text-lg"
        >
          {loading ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </div>
  );
};

export default GeneralSection;
