import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Leaf, ArrowLeft, Download, TrendingUp, Award } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLORS = ['#0d5f4d', '#14967e', '#1db89e', '#2dd4bf', '#5eead4', '#99f6e4', '#a7f3d0', '#bbf7d0', '#d1fae5'];

const ResultsPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState(null);

  useEffect(() => {
    fetchResults();
  }, [eventId]);

  const fetchResults = async () => {
    try {
      const response = await axios.get(`${API}/calculate/${eventId}`);
      setResults(response.data);
    } catch (error) {
      console.error("Error fetching results:", error);
      toast.error("Erreur lors du chargement des résultats");
    } finally {
      setLoading(false);
    }
  };

  const getEmissionClassColor = (emissionClass) => {
    const colors = {
      'A': '#0d5f4d',
      'B': '#14967e',
      'C': '#fbbf24',
      'D': '#f59e0b',
      'E': '#ef4444',
      'F': '#dc2626',
      'G': '#991b1b'
    };
    return colors[emissionClass] || '#6b7280';
  };

  const getEmissionClassLabel = (emissionClass) => {
    const labels = {
      'A': 'Excellent',
      'B': 'Très bien',
      'C': 'Bien',
      'D': 'Moyen',
      'E': 'Médiocre',
      'F': 'Faible',
      'G': 'Très faible'
    };
    return labels[emissionClass] || 'Non classé';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#0d5f4d] mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Calcul en cours...</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Aucun résultat disponible</p>
          <Button onClick={() => navigate('/')} className="mt-4 bg-[#0d5f4d] hover:bg-[#0a4a3d]">
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  const chartData = Object.entries(results.emissions_by_category).map(([category, value]) => ({
    category,
    emissions: Math.round(value * 100) / 100
  }));

  const pieData = chartData.filter(item => item.emissions > 0);

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
            <Button data-testid="back-home-results-btn" onClick={() => navigate('/')} variant="outline" className="border-[#0d5f4d] text-[#0d5f4d] hover:bg-[#f0f7f5]">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[#0d5f4d] mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>Résultats du Calcul</h2>
          <p className="text-gray-600 text-lg">{results.event_name}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card data-testid="total-emissions-card" className="border-2 border-[#0d5f4d] shadow-lg">
            <CardHeader className="bg-[#f0f7f5]">
              <CardTitle className="text-[#0d5f4d] flex items-center gap-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                <TrendingUp className="h-5 w-5" />
                Émissions Totales
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-4xl font-bold text-[#0d5f4d]" style={{ fontFamily: 'Manrope, sans-serif' }}>
                {Math.round(results.total_emissions_kg).toLocaleString()}
              </p>
              <p className="text-gray-600 mt-1">kg CO2e</p>
              <p className="text-2xl font-semibold text-[#0d5f4d] mt-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
                {(results.total_emissions_kg / 1000).toFixed(2)}
              </p>
              <p className="text-gray-600 mt-1">tonnes CO2e</p>
            </CardContent>
          </Card>

          <Card data-testid="per-participant-card" className="border-2 border-[#0d5f4d] shadow-lg">
            <CardHeader className="bg-[#f0f7f5]">
              <CardTitle className="text-[#0d5f4d]" style={{ fontFamily: 'Manrope, sans-serif' }}>Émissions par Participant</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-4xl font-bold text-[#0d5f4d]" style={{ fontFamily: 'Manrope, sans-serif' }}>
                {Math.round(results.emissions_per_participant)}
              </p>
              <p className="text-gray-600 mt-1">kg CO2e / personne</p>
            </CardContent>
          </Card>

          <Card data-testid="emission-class-card" className="border-2 shadow-lg" style={{ borderColor: getEmissionClassColor(results.emission_class) }}>
            <CardHeader style={{ backgroundColor: `${getEmissionClassColor(results.emission_class)}15` }}>
              <CardTitle className="flex items-center gap-2" style={{ color: getEmissionClassColor(results.emission_class), fontFamily: 'Manrope, sans-serif' }}>
                <Award className="h-5 w-5" />
                Classe d'Émission
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div 
                  className="h-20 w-20 rounded-full flex items-center justify-center text-3xl font-bold text-white"
                  style={{ backgroundColor: getEmissionClassColor(results.emission_class), fontFamily: 'Manrope, sans-serif' }}
                >
                  {results.emission_class}
                </div>
                <div>
                  <p className="text-xl font-semibold" style={{ color: getEmissionClassColor(results.emission_class), fontFamily: 'Manrope, sans-serif' }}>
                    {getEmissionClassLabel(results.emission_class)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Performance environnementale</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top 3 Emitters */}
        <Card data-testid="top-emitters-card" className="mb-8 border-2 border-[#0d5f4d] shadow-lg">
          <CardHeader className="bg-[#f0f7f5]">
            <CardTitle className="text-[#0d5f4d]" style={{ fontFamily: 'Manrope, sans-serif' }}>Top 3 des Catégories Émettrices</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {results.top_3_emitters.map((emitter, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-[#f0f7f5] rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="h-10 w-10 rounded-lg bg-[#0d5f4d] flex items-center justify-center text-white font-bold"
                      style={{ fontFamily: 'Manrope, sans-serif' }}
                    >
                      {index + 1}
                    </div>
                    <span className="font-semibold text-gray-800">{emitter.category}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-[#0d5f4d]" style={{ fontFamily: 'Manrope, sans-serif' }}>
                      {Math.round(emitter.emissions).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">kg CO2e</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Bar Chart */}
          <Card data-testid="bar-chart-card" className="border-2 border-[#0d5f4d] shadow-lg">
            <CardHeader className="bg-[#f0f7f5]">
              <CardTitle className="text-[#0d5f4d]" style={{ fontFamily: 'Manrope, sans-serif' }}>Émissions par Catégorie</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="category" angle={-45} textAnchor="end" height={120} tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '2px solid #0d5f4d', borderRadius: '8px' }}
                    formatter={(value) => [`${Math.round(value)} kg CO2e`, 'Émissions']}
                  />
                  <Bar dataKey="emissions" fill="#0d5f4d" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card data-testid="pie-chart-card" className="border-2 border-[#0d5f4d] shadow-lg">
            <CardHeader className="bg-[#f0f7f5]">
              <CardTitle className="text-[#0d5f4d]" style={{ fontFamily: 'Manrope, sans-serif' }}>Répartition des Émissions</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="emissions"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={true}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '2px solid #0d5f4d', borderRadius: '8px' }}
                    formatter={(value) => `${Math.round(value)} kg CO2e`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Table */}
        <Card data-testid="detailed-table-card" className="border-2 border-[#0d5f4d] shadow-lg">
          <CardHeader className="bg-[#f0f7f5]">
            <CardTitle className="text-[#0d5f4d]" style={{ fontFamily: 'Manrope, sans-serif' }}>Détail des Émissions par Catégorie</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-[#0d5f4d]">
                    <th className="text-left py-3 px-4 font-bold text-[#0d5f4d]" style={{ fontFamily: 'Manrope, sans-serif' }}>Catégorie</th>
                    <th className="text-right py-3 px-4 font-bold text-[#0d5f4d]" style={{ fontFamily: 'Manrope, sans-serif' }}>Émissions (kg CO2e)</th>
                    <th className="text-right py-3 px-4 font-bold text-[#0d5f4d]" style={{ fontFamily: 'Manrope, sans-serif' }}>% du Total</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((item, index) => {
                    const percentage = (item.emissions / results.total_emissions_kg * 100).toFixed(1);
                    return (
                      <tr key={index} className="border-b border-gray-200 hover:bg-[#f0f7f5] transition-colors">
                        <td className="py-3 px-4 font-medium text-gray-800">{item.category}</td>
                        <td className="py-3 px-4 text-right font-semibold text-[#0d5f4d]">{Math.round(item.emissions).toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-gray-600">{percentage}%</td>
                      </tr>
                    );
                  })}
                  <tr className="border-t-2 border-[#0d5f4d] font-bold">
                    <td className="py-3 px-4 text-[#0d5f4d]" style={{ fontFamily: 'Manrope, sans-serif' }}>TOTAL</td>
                    <td className="py-3 px-4 text-right text-[#0d5f4d]" style={{ fontFamily: 'Manrope, sans-serif' }}>{Math.round(results.total_emissions_kg).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-[#0d5f4d]" style={{ fontFamily: 'Manrope, sans-serif' }}>100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        <div className="mt-8 flex justify-center">
          <Button 
            data-testid="new-calculation-btn"
            onClick={() => navigate('/event/new')}
            className="bg-[#0d5f4d] hover:bg-[#0a4a3d] text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            Nouveau Calcul
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;