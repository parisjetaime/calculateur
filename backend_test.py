#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Carbon Footprint Calculator
Tests all endpoints, calculation engine, and data persistence
"""

import requests
import json
import sys
from datetime import datetime
import uuid

class CarbonCalculatorAPITester:
    def __init__(self, base_url="https://eco-metrics-24.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_event_id = None
        self.failed_tests = []

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
            self.failed_tests.append(f"{name}: {details}")

    def test_api_health(self):
        """Test basic API connectivity"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Message: {data.get('message', 'N/A')}"
            self.log_test("API Health Check", success, details)
            return success
        except Exception as e:
            self.log_test("API Health Check", False, str(e))
            return False

    def test_create_event(self):
        """Test event creation"""
        try:
            event_data = {
                "event_name": f"Test Event {datetime.now().strftime('%H%M%S')}",
                "event_type": "conference",
                "event_duration_days": 2,
                "start_date": "2024-03-15",
                "end_date": "2024-03-16",
                "total_visitors": 500,
                "visitors_foreign": 100,
                "visitors_national_non_idf": 200,
                "visitors_idf": 200,
                "total_exhibitors": 50,
                "exhibitors_foreign": 10,
                "exhibitors_national_non_idf": 20,
                "exhibitors_idf": 20,
                "organizers_count": 10
            }
            
            response = requests.post(f"{self.api_url}/events", json=event_data, timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                self.test_event_id = data.get('id')
                details = f"Event ID: {self.test_event_id}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Create Event", success, details)
            return success
        except Exception as e:
            self.log_test("Create Event", False, str(e))
            return False

    def test_get_event(self):
        """Test retrieving event"""
        if not self.test_event_id:
            self.log_test("Get Event", False, "No event ID available")
            return False
            
        try:
            response = requests.get(f"{self.api_url}/events/{self.test_event_id}", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"Event name: {data.get('event_name', 'N/A')}"
            else:
                details = f"Status: {response.status_code}"
            
            self.log_test("Get Event", success, details)
            return success
        except Exception as e:
            self.log_test("Get Event", False, str(e))
            return False

    def test_energy_data(self):
        """Test energy data creation and retrieval"""
        if not self.test_event_id:
            self.log_test("Energy Data", False, "No event ID available")
            return False
            
        try:
            # Test estimated approach
            energy_data = {
                "event_id": self.test_event_id,
                "approach": "estimated",
                "building_type": "sport_leisure_culture",
                "surface_m2": 1000,
                "has_generators": True,
                "generators_fuel_liters": 50
            }
            
            # Create energy data
            response = requests.post(f"{self.api_url}/energy", json=energy_data, timeout=10)
            create_success = response.status_code == 200
            
            if not create_success:
                self.log_test("Energy Data Creation", False, f"Status: {response.status_code}")
                return False
            
            # Retrieve energy data
            response = requests.get(f"{self.api_url}/energy/{self.test_event_id}", timeout=10)
            get_success = response.status_code == 200
            
            success = create_success and get_success
            details = "Created and retrieved successfully" if success else f"Get status: {response.status_code}"
            
            self.log_test("Energy Data", success, details)
            return success
        except Exception as e:
            self.log_test("Energy Data", False, str(e))
            return False

    def test_transport_data(self):
        """Test transport data creation"""
        if not self.test_event_id:
            return False
            
        try:
            transport_data = {
                "event_id": self.test_event_id,
                "visitors_avg_distance_foreign_km": 2000,
                "visitors_avg_distance_national_km": 500,
                "visitors_local_transport_expenses": 5000,
                "exhibitors_avg_distance_foreign_km": 1500,
                "exhibitors_avg_distance_national_km": 400,
                "exhibitors_local_transport_expenses": 2000,
                "organizers_avg_distance_km": 100,
                "organizers_round_trips": 5
            }
            
            response = requests.post(f"{self.api_url}/transport", json=transport_data, timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            self.log_test("Transport Data", success, details)
            return success
        except Exception as e:
            self.log_test("Transport Data", False, str(e))
            return False

    def test_catering_data(self):
        """Test catering data creation"""
        if not self.test_event_id:
            return False
            
        try:
            catering_data = {
                "event_id": self.test_event_id,
                "breakfasts_count": 200,
                "lunches_count": 500,
                "dinners_count": 300,
                "snacks_count": 800,
                "meals_meat_heavy_pct": 40,
                "meals_balanced_pct": 40,
                "meals_vegetarian_pct": 20,
                "dishes_type": "disposable",
                "water_liters": 1000,
                "coffee_units": 600,
                "soft_drinks_units": 400,
                "alcohol_units": 200
            }
            
            response = requests.post(f"{self.api_url}/catering", json=catering_data, timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            self.log_test("Catering Data", success, details)
            return success
        except Exception as e:
            self.log_test("Catering Data", False, str(e))
            return False

    def test_accommodation_data(self):
        """Test accommodation data creation"""
        if not self.test_event_id:
            return False
            
        try:
            accommodation_data = {
                "event_id": self.test_event_id,
                "foreign_hotel_5star_pct": 20,
                "foreign_hotel_3star_pct": 50,
                "foreign_hotel_1star_pct": 20,
                "foreign_other_accommodation_pct": 10,
                "foreign_family_pct": 0,
                "foreign_avg_nights": 2,
                "national_hotel_5star_pct": 10,
                "national_hotel_3star_pct": 60,
                "national_hotel_1star_pct": 20,
                "national_other_accommodation_pct": 10,
                "national_family_pct": 0,
                "national_avg_nights": 1
            }
            
            response = requests.post(f"{self.api_url}/accommodation", json=accommodation_data, timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            self.log_test("Accommodation Data", success, details)
            return success
        except Exception as e:
            self.log_test("Accommodation Data", False, str(e))
            return False

    def test_remaining_categories(self):
        """Test waste, communication, freight, amenities, and purchases data"""
        if not self.test_event_id:
            return False
            
        categories = [
            ("waste", {
                "event_id": self.test_event_id,
                "plastic_kg": 50,
                "cardboard_kg": 100,
                "paper_kg": 30,
                "aluminum_kg": 20,
                "textile_kg": 10,
                "furniture_kg": 200
            }),
            ("communication", {
                "event_id": self.test_event_id,
                "posters_count": 50,
                "flyers_count": 1000,
                "banners_count": 20,
                "streaming_hours": 8,
                "streaming_audience": 500,
                "communication_expenses": 5000
            }),
            ("freight", {
                "event_id": self.test_event_id,
                "decor_weight_kg": 1000,
                "decor_distance_km": 200,
                "equipment_weight_kg": 2000,
                "equipment_distance_km": 150,
                "food_weight_kg": 500,
                "food_distance_km": 100
            }),
            ("amenities", {
                "event_id": self.test_event_id,
                "site_rental_expenses": 10000,
                "reception_expenses": 3000,
                "construction_expenses": 15000,
                "it_expenses": 5000
            }),
            ("purchases", {
                "event_id": self.test_event_id,
                "goodies_expenses_per_person": 15,
                "badges_visitors": 500,
                "badges_exhibitors": 50,
                "badges_organizers": 10,
                "badges_type": "plastic_soft"
            })
        ]
        
        all_success = True
        for category, data in categories:
            try:
                response = requests.post(f"{self.api_url}/{category}", json=data, timeout=10)
                success = response.status_code == 200
                details = f"Status: {response.status_code}"
                
                self.log_test(f"{category.title()} Data", success, details)
                if not success:
                    all_success = False
            except Exception as e:
                self.log_test(f"{category.title()} Data", False, str(e))
                all_success = False
        
        return all_success

    def test_calculation_engine(self):
        """Test the carbon emission calculation"""
        if not self.test_event_id:
            self.log_test("Calculation Engine", False, "No event ID available")
            return False
            
        try:
            response = requests.get(f"{self.api_url}/calculate/{self.test_event_id}", timeout=15)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                total_emissions = data.get('total_emissions_kg', 0)
                emissions_per_participant = data.get('emissions_per_participant', 0)
                emission_class = data.get('emission_class', 'N/A')
                top_3 = data.get('top_3_emitters', [])
                
                # Validate calculation results
                validation_success = (
                    total_emissions > 0 and
                    emissions_per_participant > 0 and
                    emission_class in ['A', 'B', 'C', 'D', 'E', 'F', 'G'] and
                    len(top_3) <= 3
                )
                
                if validation_success:
                    details = f"Total: {total_emissions:.0f} kg CO2e, Per participant: {emissions_per_participant:.0f} kg, Class: {emission_class}"
                else:
                    details = f"Invalid calculation results: Total={total_emissions}, Class={emission_class}"
                    success = False
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Calculation Engine", success, details)
            return success
        except Exception as e:
            self.log_test("Calculation Engine", False, str(e))
            return False

    def test_list_events(self):
        """Test listing all events"""
        try:
            response = requests.get(f"{self.api_url}/events", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"Found {len(data)} events"
            else:
                details = f"Status: {response.status_code}"
            
            self.log_test("List Events", success, details)
            return success
        except Exception as e:
            self.log_test("List Events", False, str(e))
            return False

    def run_all_tests(self):
        """Run comprehensive backend testing"""
        print("🧪 Starting Carbon Calculator Backend API Tests")
        print("=" * 60)
        
        # Test sequence
        tests = [
            self.test_api_health,
            self.test_create_event,
            self.test_get_event,
            self.test_energy_data,
            self.test_transport_data,
            self.test_catering_data,
            self.test_accommodation_data,
            self.test_remaining_categories,
            self.test_calculation_engine,
            self.test_list_events
        ]
        
        for test in tests:
            test()
        
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for failure in self.failed_tests:
                print(f"  - {failure}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        return success_rate >= 80  # Consider 80%+ as acceptable

def main():
    tester = CarbonCalculatorAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())