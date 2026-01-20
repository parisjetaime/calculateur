import { useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import EventFormPage from "@/pages/EventFormPage";
import ResultsPage from "@/pages/ResultsPage";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <div className="App">
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/event/new" element={<EventFormPage />} />
          <Route path="/event/:eventId" element={<EventFormPage />} />
          <Route path="/results/:eventId" element={<ResultsPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;