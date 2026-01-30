import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, Calculator, Users, Building2, Music } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Types d'événements selon l'Excel
const EVENT_TYPES = {
  Evenement_professionnel: [
    "Salon professionnel international",
    "Salon professionnel national",
    "Salon grand public",
    "Evenement d'entreprise: conventions et AG",
    "Evenement d'entreprise: communication extérieure",
    "Evenement d'entreprise: séminaire",
    "Evenement d'entreprise: soirée d'entreprise",
    "Congrès national",
    "Congrès international"
  ],
  Evenement_culturel: [
    "Festival",
    "Exposition",
    "Spectacle en salle (concert, théâtre, …)",
    "Evenement/spectacle en plein air",
    "Tournage de spots/film"
  ],
  Evenement_sportif: [
    "Course à pied (marathons, trails, …)",
    "Course hippique",
    "Sport en salle (escrime, basketball, …)",
    "Evenement en stade (match de football, athlétisme, …)",
    "Autre évènement extérieur (beach-volley, régate, …)"
  ]
};

// Données OTCP pour les événements professionnels (pour le calcul automatique quand les taux sont inconnus)
const OTCP_DATA = {
  "Salon professionnel international": { visiteurs_etrangers: 0.15, visiteurs_idf: 0.445, org_etrangeres: 0.47, org_idf: 0.264 },
  "Salon professionnel national": { visiteurs_etrangers: 0.03, visiteurs_idf: 0.485, org_etrangeres: 0.04, org_idf: 0.48 },
  "Salon grand public": { visiteurs_etrangers: 0.005, visiteurs_idf: 0.498, org_etrangeres: 0.035, org_idf: 0.483 },
  "Evenement d'entreprise: conventions et AG": { visiteurs_etrangers: 0.15, visiteurs_idf: 0.51, org_etrangeres: 0, org_idf: 0 },
  "Evenement d'entreprise: communication extérieure": { visiteurs_etrangers: 0.17, visiteurs_idf: 0.64, org_etrangeres: 0, org_idf: 0 },
  "Evenement d'entreprise: séminaire": { visiteurs_etrangers: 0.13, visiteurs_idf: 0.58, org_etrangeres: 0, org_idf: 0 },
  "Evenement d'entreprise: soirée d'entreprise": { visiteurs_etrangers: 0.04, visiteurs_idf: 0.69, org_etrangeres: 0, org_idf: 0 },
  "Congrès national": { visiteurs_etrangers: 0.02, visiteurs_idf: 0.417, org_etrangeres: 0, org_idf: 0.5 },
  "Congrès international": { visiteurs_etrangers: 0.547, visiteurs_idf: 0.143, org_etrangeres: 0.2, org_idf: 0.5 }
};

// Personnes par entreprise exposante
const PERSONS_PER_ORG = {
  nationale: 5,
  etrangere: 4.1
};

const GeneralSection = ({ onSave, initialData, onCalculatedValuesChange }) => {
  const [formData, setFormData] = useState({
    // Informations de base
    event_name: "",
    event_type: "Evenement_culturel",
    event_subtype: "",
    start_date: "",
    end_date: "",
    
    // Visiteurs
    total_visitors: 0,
    visitors_foreign_pct: 0,
    visitors_idf_pct: 0,
    unknown_foreign_rate: false,
    unknown_idf_rate: false,
    
    // Paramètres exposants (événements professionnels)
    exhibiting_organizations: 0,
    organizations_foreign_pct: 0,
    organizations_idf_pct: 0,
    unknown_organizations_foreign_rate: false,
    unknown_organizations_idf_rate: false,
    
    // Paramètres sportifs/artistes (événements culturels/sportifs)
    athletes_artists_count: 0,
    athletes_artists_foreign_pct: 0,
    athletes_artists_idf_pct: 0,
    
    ...initialData,
  });

  const [calculatedValues, setCalculatedValues] = useState({
    event_duration: 0,
    visitors_foreign: 0,
    visitors_national_non_idf: 0,
    visitors_idf: 0,
    exhibitors_foreign: 0,
    exhibitors_national_non_idf: 0,
    exhibitors_idf: 0,
    total_exhibitors: 0,
    total_foreign: 0,
    total_national_non_idf: 0,
    total_idf: 0,
  });

  // Fonction de calcul selon les formules Excel
  const calculateValues = useCallback(() => {
    const {
      event_type,
      event_subtype,
      start_date,
      end_date,
      total_visitors,
      visitors_foreign_pct,
      visitors_idf_pct,
      unknown_foreign_rate,
      unknown_idf_rate,
      exhibiting_organizations,
      organizations_foreign_pct,
      organizations_idf_pct,
      unknown_organizations_foreign_rate,
      unknown_organizations_idf_rate,
      athletes_artists_count,
      athletes_artists_foreign_pct,
      athletes_artists_idf_pct,
    } = formData;

    // Durée de l'événement (H4 dans Excel)
    // =SI.CONDITIONS(ESTVIDE(D5)=VRAI;0;ESTVIDE(D6=VRAI);0;D5=D6;1;D5<>D6; D6-D5+1)
    let event_duration = 0;
    if (start_date && end_date) {
      const startDateObj = new Date(start_date);
      const endDateObj = new Date(end_date);
      if (startDateObj.getTime() === endDateObj.getTime()) {
        event_duration = 1;
      } else {
        event_duration = Math.ceil((endDateObj - startDateObj) / (1000 * 60 * 60 * 24)) + 1;
      }
    }

    // Récupérer les données OTCP si disponibles
    const otcpData = event_type === "Evenement_professionnel" && event_subtype ? OTCP_DATA[event_subtype] : null;

    // Nombre de visiteurs étrangers et DOM-TOM (H5)
    let visitors_foreign = 0;
    if (event_type === "Evenement_professionnel") {
      if (unknown_foreign_rate && otcpData) {
        visitors_foreign = Math.round(total_visitors * otcpData.visiteurs_etrangers);
      } else {
        visitors_foreign = Math.round(total_visitors * (visitors_foreign_pct / 100));
      }
    } else {
      visitors_foreign = Math.round(total_visitors * (visitors_foreign_pct / 100));
    }

    // Nombre de visiteurs franciliens (H7)
    let visitors_idf = 0;
    if (event_type === "Evenement_professionnel") {
      if (unknown_idf_rate && otcpData) {
        visitors_idf = Math.round(total_visitors * otcpData.visiteurs_idf);
      } else {
        visitors_idf = Math.round(total_visitors * (visitors_idf_pct / 100));
      }
    } else {
      visitors_idf = Math.round(total_visitors * (visitors_idf_pct / 100));
    }

    // Nombre de visiteurs nationaux non IDF (H6)
    // = Total - Etrangers - IDF
    const visitors_national_non_idf = Math.max(0, total_visitors - visitors_foreign - visitors_idf);

    // Calcul des exposants/sportifs/artistes
    let exhibitors_foreign = 0;
    let exhibitors_national_non_idf = 0;
    let exhibitors_idf = 0;

    if (event_type === "Evenement_professionnel") {
      // Pour les événements professionnels, on utilise les organisations exposantes
      // Moyenne pondérée des personnes par organisation
      const avgPersonsPerOrg = (PERSONS_PER_ORG.nationale + PERSONS_PER_ORG.etrangere) / 2;
      
      // % organisations étrangères
      let org_foreign_pct = organizations_foreign_pct;
      if (unknown_organizations_foreign_rate && otcpData) {
        org_foreign_pct = otcpData.org_etrangeres * 100;
      }

      // % organisations IDF
      let org_idf_pct = organizations_idf_pct;
      if (unknown_organizations_idf_rate && otcpData) {
        org_idf_pct = otcpData.org_idf * 100;
      }

      // Calcul du nombre d'exposants par origine
      exhibitors_foreign = Math.round(exhibiting_organizations * (org_foreign_pct / 100) * PERSONS_PER_ORG.etrangere);
      exhibitors_idf = Math.round(exhibiting_organizations * (org_idf_pct / 100) * PERSONS_PER_ORG.nationale);
      exhibitors_national_non_idf = Math.round(
        exhibiting_organizations * ((100 - org_foreign_pct - org_idf_pct) / 100) * PERSONS_PER_ORG.nationale
      );
    } else if (event_type === "Evenement_culturel" || event_type === "Evenement_sportif") {
      // Pour les événements culturels/sportifs, on utilise directement les sportifs/artistes
      exhibitors_foreign = Math.round(athletes_artists_count * (athletes_artists_foreign_pct / 100));
      exhibitors_idf = Math.round(athletes_artists_count * (athletes_artists_idf_pct / 100));
      exhibitors_national_non_idf = Math.round(
        athletes_artists_count * ((100 - athletes_artists_foreign_pct - athletes_artists_idf_pct) / 100)
      );
    }

    // Totaux
    const total_exhibitors = exhibitors_foreign + exhibitors_national_non_idf + exhibitors_idf;
    const total_foreign = visitors_foreign + exhibitors_foreign;
    const total_national_non_idf = visitors_national_non_idf + exhibitors_national_non_idf;
    const total_idf = visitors_idf + exhibitors_idf;

    const newCalculatedValues = {
      event_duration,
      visitors_foreign,
      visitors_national_non_idf,
      visitors_idf,
      exhibitors_foreign,
      exhibitors_national_non_idf,
      exhibitors_idf,
      total_exhibitors,
      total_foreign,
      total_national_non_idf,
      total_idf,
    };

    setCalculatedValues(newCalculatedValues);
    
    // Notifier le parent des nouvelles valeurs calculées
    if (onCalculatedValuesChange) {
      onCalculatedValuesChange(newCalculatedValues);
    }
  }, [formData, onCalculatedValuesChange]);

  useEffect(() => {
    calculateValues();
  }, [calculateValues]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        ...formData,
        event_duration_days: calculatedValues.event_duration,
        calculated_visitors_foreign: calculatedValues.visitors_foreign,
        calculated_visitors_national_non_idf: calculatedValues.visitors_national_non_idf,
        calculated_visitors_idf: calculatedValues.visitors_idf,
        calculated_exhibitors_foreign: calculatedValues.exhibitors_foreign,
        calculated_exhibitors_national: calculatedValues.exhibitors_national_non_idf,
        calculated_exhibitors_idf: calculatedValues.exhibitors_idf,
        calculated_total_exhibitors: calculatedValues.total_exhibitors,
        calculated_total_foreign: calculatedValues.total_foreign,
        calculated_total_national: calculatedValues.total_national_non_idf,
        calculated_total_idf: calculatedValues.total_idf,
      });
    }
  };

  const isProfessional = formData.event_type === "Evenement_professionnel";
  const isCulturalOrSport = formData.event_type === "Evenement_culturel" || formData.event_type === "Evenement_sportif";

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* ===== COLONNE GAUCHE - SAISIE ===== */}
        <Card className="border-2 border-[#0d5f4d] shadow-lg">
          <CardHeader className="bg-[#0d5f4d] text-white py-3">
            <CardTitle className="flex items-center gap-2 text-lg" style={{ fontFamily: 'Manrope, sans-serif' }}>
              <Leaf className="h-5 w-5" />
              1. Général - Saisie des données
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {/* Nom de l'événement */}
            <div className="grid grid-cols-3 gap-2 items-center">
              <Label className="text-sm font-medium">Nom de l'événement</Label>
              <div className="col-span-2">
                <Input
                  data-testid="event-name-input"
                  value={formData.event_name}
                  onChange={(e) => handleChange('event_name', e.target.value)}
                  placeholder="Ex: Paris Event"
                  className="h-9"
                />
              </div>
            </div>

            {/* Type d'événement */}
            <div className="grid grid-cols-3 gap-2 items-center">
              <Label className="text-sm font-medium">Type d'événement</Label>
              <div className="col-span-2 flex gap-2">
                <Select 
                  value={formData.event_type} 
                  onValueChange={(val) => {
                    handleChange('event_type', val);
                    handleChange('event_subtype', '');
                  }}
                >
                  <SelectTrigger data-testid="event-type-select" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Evenement_culturel">Événement culturel</SelectItem>
                    <SelectItem value="Evenement_professionnel">Événement professionnel</SelectItem>
                    <SelectItem value="Evenement_sportif">Événement sportif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Préciser le type */}
            <div className="grid grid-cols-3 gap-2 items-center">
              <Label className="text-sm text-gray-600">Préciser</Label>
              <div className="col-span-2">
                <Select 
                  value={formData.event_subtype} 
                  onValueChange={(val) => handleChange('event_subtype', val)}
                >
                  <SelectTrigger data-testid="event-subtype-select" className="h-9">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES[formData.event_type]?.map((subtype) => (
                      <SelectItem key={subtype} value={subtype}>{subtype}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-3 gap-2 items-center">
              <Label className="text-sm font-medium">Quand l'événement aura-t-il lieu ?</Label>
              <div className="col-span-2 grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-gray-500">Date de début</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleChange('start_date', e.target.value)}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Date de fin</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => handleChange('end_date', e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>
            </div>

            {/* Nombre de visiteurs */}
            <div className="grid grid-cols-3 gap-2 items-center">
              <Label className="text-sm font-medium">Nombre de visiteurs prévu</Label>
              <div className="col-span-2">
                <Input
                  data-testid="total-visitors-input"
                  type="number"
                  min="0"
                  value={formData.total_visitors || ''}
                  onChange={(e) => handleChange('total_visitors', parseInt(e.target.value) || 0)}
                  className="h-9"
                />
              </div>
            </div>

            {/* Part visiteurs étrangers */}
            <div className="grid grid-cols-3 gap-2 items-start">
              <Label className="text-sm font-medium pt-2">Part de visiteurs étrangers et DOM-TOM</Label>
              <div className="col-span-2 space-y-1">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.visitors_foreign_pct || ''}
                    onChange={(e) => handleChange('visitors_foreign_pct', parseFloat(e.target.value) || 0)}
                    disabled={formData.unknown_foreign_rate}
                    className="h-9"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="unknown_foreign"
                    checked={formData.unknown_foreign_rate}
                    onCheckedChange={(checked) => handleChange('unknown_foreign_rate', checked)}
                  />
                  <Label htmlFor="unknown_foreign" className="text-xs text-gray-600 cursor-pointer">
                    Je ne connais pas le taux de visiteurs étrangers
                  </Label>
                </div>
              </div>
            </div>

            {/* % visiteurs franciliens */}
            <div className="grid grid-cols-3 gap-2 items-start">
              <Label className="text-sm font-medium pt-2">% visiteurs franciliens</Label>
              <div className="col-span-2 space-y-1">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.visitors_idf_pct || ''}
                    onChange={(e) => handleChange('visitors_idf_pct', parseFloat(e.target.value) || 0)}
                    disabled={formData.unknown_idf_rate}
                    className="h-9"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="unknown_idf"
                    checked={formData.unknown_idf_rate}
                    onCheckedChange={(checked) => handleChange('unknown_idf_rate', checked)}
                  />
                  <Label htmlFor="unknown_idf" className="text-xs text-gray-600 cursor-pointer">
                    Je ne connais pas le taux de visiteurs franciliens
                  </Label>
                </div>
              </div>
            </div>

            {/* Section Exposants (événements professionnels) */}
            {isProfessional && (
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-[#0d5f4d] mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Paramètres exposants (événements professionnels)
                </h4>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <Label className="text-sm">Nombre d'organisations exposantes</Label>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min="0"
                        value={formData.exhibiting_organizations || ''}
                        onChange={(e) => handleChange('exhibiting_organizations', parseInt(e.target.value) || 0)}
                        className="h-9"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 items-start">
                    <Label className="text-sm pt-2">% d'organisations étrangères</Label>
                    <div className="col-span-2 space-y-1">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={formData.organizations_foreign_pct || ''}
                          onChange={(e) => handleChange('organizations_foreign_pct', parseFloat(e.target.value) || 0)}
                          disabled={formData.unknown_organizations_foreign_rate}
                          className="h-9"
                        />
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="unknown_org_foreign"
                          checked={formData.unknown_organizations_foreign_rate}
                          onCheckedChange={(checked) => handleChange('unknown_organizations_foreign_rate', checked)}
                        />
                        <Label htmlFor="unknown_org_foreign" className="text-xs text-gray-600 cursor-pointer">
                          Je ne connais pas le % d'organisations étrangères
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 items-start">
                    <Label className="text-sm pt-2">% d'organisations franciliennes</Label>
                    <div className="col-span-2 space-y-1">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={formData.organizations_idf_pct || ''}
                          onChange={(e) => handleChange('organizations_idf_pct', parseFloat(e.target.value) || 0)}
                          disabled={formData.unknown_organizations_idf_rate}
                          className="h-9"
                        />
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="unknown_org_idf"
                          checked={formData.unknown_organizations_idf_rate}
                          onCheckedChange={(checked) => handleChange('unknown_organizations_idf_rate', checked)}
                        />
                        <Label htmlFor="unknown_org_idf" className="text-xs text-gray-600 cursor-pointer">
                          Je ne connais pas le % d'organisations franciliennes
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section Sportifs/Artistes (événements culturels/sportifs) */}
            {isCulturalOrSport && (
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-[#0d5f4d] mb-3 flex items-center gap-2">
                  <Music className="h-4 w-4" />
                  Paramètres sportifs/artistes
                </h4>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <Label className="text-sm">Nombre de sportifs/artistes</Label>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min="0"
                        value={formData.athletes_artists_count || ''}
                        onChange={(e) => handleChange('athletes_artists_count', parseInt(e.target.value) || 0)}
                        className="h-9"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 items-center">
                    <Label className="text-sm">% de sportifs/artistes étrangers</Label>
                    <div className="col-span-2 flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.athletes_artists_foreign_pct || ''}
                        onChange={(e) => handleChange('athletes_artists_foreign_pct', parseFloat(e.target.value) || 0)}
                        className="h-9"
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 items-center">
                    <Label className="text-sm">% de sportifs/artistes IDF</Label>
                    <div className="col-span-2 flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.athletes_artists_idf_pct || ''}
                        onChange={(e) => handleChange('athletes_artists_idf_pct', parseFloat(e.target.value) || 0)}
                        className="h-9"
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ===== COLONNE DROITE - PARAMETRES CALCULES ===== */}
        <Card className="border-2 border-[#0d5f4d] shadow-lg">
          <CardHeader className="bg-[#f0f7f5] py-3 border-b border-[#0d5f4d]">
            <CardTitle className="flex items-center gap-2 text-lg text-[#0d5f4d]" style={{ fontFamily: 'Manrope, sans-serif' }}>
              <Calculator className="h-5 w-5" />
              1. Général - Paramètres calculés
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {/* Table des paramètres calculés */}
            <div className="space-y-1">
              {/* En-tête */}
              <div className="grid grid-cols-12 gap-2 py-2 border-b-2 border-[#0d5f4d] bg-[#f0f7f5] px-2 rounded-t">
                <div className="col-span-7 text-sm font-semibold text-[#0d5f4d]">Paramètre calculé</div>
                <div className="col-span-3 text-sm font-semibold text-[#0d5f4d] text-right">Valeur</div>
                <div className="col-span-2 text-sm font-semibold text-[#0d5f4d]">Unité</div>
              </div>

              {/* Durée de l'événement */}
              <div className="grid grid-cols-12 gap-2 py-2 px-2 hover:bg-gray-50">
                <div className="col-span-7 text-sm">Durée de l'événement</div>
                <div className="col-span-3 text-sm text-right font-bold text-[#0d5f4d]">
                  {calculatedValues.event_duration}
                </div>
                <div className="col-span-2 text-sm text-gray-600">jour(s)</div>
              </div>

              {/* Séparateur */}
              <div className="border-t border-gray-200 my-2"></div>

              {/* Visiteurs */}
              <div className="grid grid-cols-12 gap-2 py-2 px-2 hover:bg-gray-50">
                <div className="col-span-7 text-sm flex items-center gap-1">
                  <Users className="h-3 w-3 text-[#0d5f4d]" />
                  Nombre de visiteurs étrangers et DOM-TOM
                </div>
                <div className="col-span-3 text-sm text-right font-bold text-[#0d5f4d]">
                  {calculatedValues.visitors_foreign.toLocaleString()}
                </div>
                <div className="col-span-2 text-sm text-gray-600">personnes</div>
              </div>

              <div className="grid grid-cols-12 gap-2 py-2 px-2 hover:bg-gray-50">
                <div className="col-span-7 text-sm">Nombre de visiteurs nationaux non IDF</div>
                <div className="col-span-3 text-sm text-right font-bold text-[#0d5f4d]">
                  {calculatedValues.visitors_national_non_idf.toLocaleString()}
                </div>
                <div className="col-span-2 text-sm text-gray-600">personnes</div>
              </div>

              <div className="grid grid-cols-12 gap-2 py-2 px-2 hover:bg-gray-50">
                <div className="col-span-7 text-sm">Nombre de visiteurs franciliens</div>
                <div className="col-span-3 text-sm text-right font-bold text-[#0d5f4d]">
                  {calculatedValues.visitors_idf.toLocaleString()}
                </div>
                <div className="col-span-2 text-sm text-gray-600">personnes</div>
              </div>

              {/* Séparateur */}
              <div className="border-t border-gray-200 my-2"></div>

              {/* Exposants/Sportifs/Artistes */}
              <div className="grid grid-cols-12 gap-2 py-2 px-2 hover:bg-gray-50">
                <div className="col-span-7 text-sm">
                  Nombre d'{isProfessional ? "exposants" : "sportifs/artistes"} étrangers
                </div>
                <div className="col-span-3 text-sm text-right font-bold text-[#0d5f4d]">
                  {calculatedValues.exhibitors_foreign.toLocaleString()}
                </div>
                <div className="col-span-2 text-sm text-gray-600">personnes</div>
              </div>

              <div className="grid grid-cols-12 gap-2 py-2 px-2 hover:bg-gray-50">
                <div className="col-span-7 text-sm">
                  Nombre d'{isProfessional ? "exposants" : "sportifs/artistes"} nationaux non IDF
                </div>
                <div className="col-span-3 text-sm text-right font-bold text-[#0d5f4d]">
                  {calculatedValues.exhibitors_national_non_idf.toLocaleString()}
                </div>
                <div className="col-span-2 text-sm text-gray-600">personnes</div>
              </div>

              <div className="grid grid-cols-12 gap-2 py-2 px-2 hover:bg-gray-50">
                <div className="col-span-7 text-sm">
                  Nombre d'{isProfessional ? "exposants" : "sportifs/artistes"} franciliens
                </div>
                <div className="col-span-3 text-sm text-right font-bold text-[#0d5f4d]">
                  {calculatedValues.exhibitors_idf.toLocaleString()}
                </div>
                <div className="col-span-2 text-sm text-gray-600">personnes</div>
              </div>

              <div className="grid grid-cols-12 gap-2 py-2 px-2 bg-[#f0f7f5] rounded">
                <div className="col-span-7 text-sm font-semibold">
                  Nombre total d'{isProfessional ? "exposants" : "sportifs/artistes"}
                </div>
                <div className="col-span-3 text-sm text-right font-bold text-[#0d5f4d]">
                  {calculatedValues.total_exhibitors.toLocaleString()}
                </div>
                <div className="col-span-2 text-sm text-gray-600">personnes</div>
              </div>

              {/* Séparateur */}
              <div className="border-t border-gray-200 my-2"></div>

              {/* Totaux généraux */}
              <div className="grid grid-cols-12 gap-2 py-2 px-2 bg-[#e8f5f0] rounded">
                <div className="col-span-7 text-sm font-semibold">Nombre total d'étrangers et DOM-TOM</div>
                <div className="col-span-3 text-sm text-right font-bold text-[#0d5f4d]">
                  {calculatedValues.total_foreign.toLocaleString()}
                </div>
                <div className="col-span-2 text-sm text-gray-600">personnes</div>
              </div>

              <div className="grid grid-cols-12 gap-2 py-2 px-2 bg-[#e8f5f0] rounded">
                <div className="col-span-7 text-sm font-semibold">Nombre total de nationaux non IDF</div>
                <div className="col-span-3 text-sm text-right font-bold text-[#0d5f4d]">
                  {calculatedValues.total_national_non_idf.toLocaleString()}
                </div>
                <div className="col-span-2 text-sm text-gray-600">personnes</div>
              </div>

              <div className="grid grid-cols-12 gap-2 py-2 px-2 bg-[#e8f5f0] rounded">
                <div className="col-span-7 text-sm font-semibold">Nombre total de franciliens</div>
                <div className="col-span-3 text-sm text-right font-bold text-[#0d5f4d]">
                  {calculatedValues.total_idf.toLocaleString()}
                </div>
                <div className="col-span-2 text-sm text-gray-600">personnes</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bouton de sauvegarde */}
      {onSave && (
        <div className="mt-6 flex justify-center">
          <Button
            data-testid="save-general-btn"
            onClick={handleSave}
            disabled={!formData.event_name}
            className="bg-[#0d5f4d] hover:bg-[#0a4a3d] text-white px-8 py-3 text-base"
          >
            Enregistrer la section Général
          </Button>
        </div>
      )}
    </div>
  );
};

export default GeneralSection;
