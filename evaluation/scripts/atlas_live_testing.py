#!/usr/bin/env python3
"""
ATLAS Live Application Testing Script
Tests the deployed ATLAS application at: https://atlas-clinical-git-main-lambdabypis-projects.vercel.app/
"""

import requests
import time
import json
import pandas as pd
import numpy as np
from datetime import datetime
from pathlib import Path
import subprocess
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ATLASLiveTester:
    """Test the live ATLAS application"""
    
    def __init__(self, base_url="https://atlas-clinical-git-main-lambdabypis-projects.vercel.app"):
        self.base_url = base_url
        self.test_results = {}
        self.timestamp = datetime.now().isoformat()
        
        # Setup Chrome driver for testing
        self.setup_webdriver()
    
    def setup_webdriver(self):
        """Setup Chrome WebDriver for testing"""
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        
        try:
            self.driver = webdriver.Chrome(options=chrome_options)
            logger.info("Chrome WebDriver initialized successfully")
        except Exception as e:
            logger.warning(f"Failed to initialize Chrome WebDriver: {e}")
            self.driver = None

    def test_application_accessibility(self):
        """Test basic application accessibility and loading"""
        results = {
            'test_name': 'application_accessibility',
            'timestamp': datetime.now().isoformat(),
            'results': {}
        }
        
        try:
            # Test main page load
            response = requests.get(self.base_url, timeout=10)
            results['results']['main_page_status'] = response.status_code
            results['results']['main_page_load_time'] = response.elapsed.total_seconds()
            results['results']['main_page_accessible'] = response.status_code == 200
            
            # Test key endpoints
            key_pages = [
                '/dashboard',
                '/patients', 
                '/consultation/new',
                '/guidelines',
                '/reference'
            ]
            
            for page in key_pages:
                try:
                    page_response = requests.get(f"{self.base_url}{page}", timeout=10)
                    results['results'][f'page{page}_status'] = page_response.status_code
                    results['results'][f'page{page}_accessible'] = page_response.status_code == 200
                except Exception as e:
                    results['results'][f'page{page}_error'] = str(e)
                    results['results'][f'page{page}_accessible'] = False
            
        except Exception as e:
            results['error'] = str(e)
            logger.error(f"Application accessibility test failed: {e}")
        
        self.test_results['accessibility'] = results
        return results

    def test_pwa_functionality(self):
        """Test Progressive Web App functionality"""
        results = {
            'test_name': 'pwa_functionality',
            'timestamp': datetime.now().isoformat(),
            'results': {}
        }
        
        if not self.driver:
            results['error'] = 'WebDriver not available'
            return results
        
        try:
            # Navigate to main page
            self.driver.get(self.base_url)
            
            # Check for PWA manifest
            try:
                manifest_link = self.driver.find_element(By.XPATH, "//link[@rel='manifest']")
                manifest_href = manifest_link.get_attribute('href')
                
                # Test manifest accessibility
                manifest_response = requests.get(manifest_href)
                results['results']['manifest_accessible'] = manifest_response.status_code == 200
                
                if manifest_response.status_code == 200:
                    manifest_data = manifest_response.json()
                    results['results']['manifest_data'] = {
                        'name': manifest_data.get('name', ''),
                        'short_name': manifest_data.get('short_name', ''),
                        'start_url': manifest_data.get('start_url', ''),
                        'display': manifest_data.get('display', ''),
                        'theme_color': manifest_data.get('theme_color', '')
                    }
                
            except Exception as e:
                results['results']['manifest_error'] = str(e)
            
            # Check for service worker registration
            service_worker_script = """
            return navigator.serviceWorker.ready.then(function(registration) {
                return {
                    scope: registration.scope,
                    active: registration.active !== null,
                    waiting: registration.waiting !== null,
                    installing: registration.installing !== null
                };
            }).catch(function(error) {
                return {error: error.message};
            });
            """
            
            try:
                sw_result = self.driver.execute_async_script(f"""
                var callback = arguments[arguments.length - 1];
                {service_worker_script}
                .then(callback)
                .catch(function(error) {{ callback({{error: error.message}}); }});
                """)
                results['results']['service_worker'] = sw_result
            except Exception as e:
                results['results']['service_worker_error'] = str(e)
            
            # Test offline storage capabilities
            try:
                storage_test = self.driver.execute_script("""
                var tests = {};
                
                // Test localStorage
                try {
                    localStorage.setItem('atlas_test', 'test_value');
                    tests.localStorage = localStorage.getItem('atlas_test') === 'test_value';
                    localStorage.removeItem('atlas_test');
                } catch(e) {
                    tests.localStorage = false;
                    tests.localStorageError = e.message;
                }
                
                // Test sessionStorage
                try {
                    sessionStorage.setItem('atlas_test', 'test_value');
                    tests.sessionStorage = sessionStorage.getItem('atlas_test') === 'test_value';
                    sessionStorage.removeItem('atlas_test');
                } catch(e) {
                    tests.sessionStorage = false;
                    tests.sessionStorageError = e.message;
                }
                
                // Test IndexedDB availability
                tests.indexedDB = typeof indexedDB !== 'undefined';
                
                return tests;
                """)
                results['results']['storage_capabilities'] = storage_test
            except Exception as e:
                results['results']['storage_test_error'] = str(e)
            
        except Exception as e:
            results['error'] = str(e)
            logger.error(f"PWA functionality test failed: {e}")
        
        self.test_results['pwa_functionality'] = results
        return results

    def test_user_interface_responsiveness(self):
        """Test UI responsiveness across different viewport sizes"""
        results = {
            'test_name': 'ui_responsiveness',
            'timestamp': datetime.now().isoformat(),
            'results': {}
        }
        
        if not self.driver:
            results['error'] = 'WebDriver not available'
            return results
        
        # Test different viewport sizes
        viewports = {
            'mobile': (375, 667),
            'tablet': (768, 1024),
            'desktop': (1920, 1080)
        }
        
        try:
            for device, (width, height) in viewports.items():
                self.driver.set_window_size(width, height)
                self.driver.get(self.base_url)
                
                # Wait for page to load
                WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.TAG_NAME, "body"))
                )
                
                # Test key elements visibility
                device_results = {
                    'viewport_size': f"{width}x{height}",
                    'page_loaded': True
                }
                
                # Check for navigation elements
                try:
                    nav_element = self.driver.find_element(By.TAG_NAME, "nav")
                    device_results['navigation_visible'] = nav_element.is_displayed()
                except:
                    device_results['navigation_visible'] = False
                
                # Check for main content
                try:
                    main_content = self.driver.find_element(By.TAG_NAME, "main")
                    device_results['main_content_visible'] = main_content.is_displayed()
                except:
                    device_results['main_content_visible'] = False
                
                # Test page performance metrics
                performance_script = """
                return {
                    domContentLoaded: performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd - performance.getEntriesByType('navigation')[0].domContentLoadedEventStart,
                    loadComplete: performance.getEntriesByType('navigation')[0].loadEventEnd - performance.getEntriesByType('navigation')[0].loadEventStart,
                    memoryUsed: performance.memory ? performance.memory.usedJSHeapSize : null
                };
                """
                
                try:
                    perf_metrics = self.driver.execute_script(performance_script)
                    device_results['performance'] = perf_metrics
                except Exception as e:
                    device_results['performance_error'] = str(e)
                
                results['results'][device] = device_results
        
        except Exception as e:
            results['error'] = str(e)
            logger.error(f"UI responsiveness test failed: {e}")
        
        self.test_results['ui_responsiveness'] = results
        return results

    def test_patient_management_workflow(self):
        """Test basic patient management functionality"""
        results = {
            'test_name': 'patient_management_workflow',
            'timestamp': datetime.now().isoformat(),
            'results': {}
        }
        
        if not self.driver:
            results['error'] = 'WebDriver not available'
            return results
        
        try:
            # Navigate to patients page
            self.driver.get(f"{self.base_url}/patients")
            
            # Wait for page to load
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            # Check if patients list loads
            try:
                # Look for patient-related elements
                patients_elements = self.driver.find_elements(By.XPATH, "//*[contains(text(), 'Patient') or contains(text(), 'patient')]")
                results['results']['patients_page_loaded'] = len(patients_elements) > 0
            except Exception as e:
                results['results']['patients_page_error'] = str(e)
            
            # Test add new patient navigation
            try:
                self.driver.get(f"{self.base_url}/patients/new")
                WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.TAG_NAME, "body"))
                )
                
                # Look for form elements
                form_elements = self.driver.find_elements(By.TAG_NAME, "input")
                results['results']['new_patient_form_loaded'] = len(form_elements) > 0
                results['results']['form_elements_count'] = len(form_elements)
                
            except Exception as e:
                results['results']['new_patient_error'] = str(e)
        
        except Exception as e:
            results['error'] = str(e)
            logger.error(f"Patient management workflow test failed: {e}")
        
        self.test_results['patient_workflow'] = results
        return results

    def test_consultation_workflow(self):
        """Test consultation creation and management"""
        results = {
            'test_name': 'consultation_workflow',
            'timestamp': datetime.now().isoformat(),
            'results': {}
        }
        
        if not self.driver:
            results['error'] = 'WebDriver not available'
            return results
        
        try:
            # Navigate to new consultation page
            self.driver.get(f"{self.base_url}/consultation/new")
            
            # Wait for page to load
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            # Check for consultation form elements
            form_elements = self.driver.find_elements(By.TAG_NAME, "input")
            textarea_elements = self.driver.find_elements(By.TAG_NAME, "textarea")
            select_elements = self.driver.find_elements(By.TAG_NAME, "select")
            
            results['results']['consultation_form_loaded'] = len(form_elements) > 0 or len(textarea_elements) > 0
            results['results']['input_elements'] = len(form_elements)
            results['results']['textarea_elements'] = len(textarea_elements)
            results['results']['select_elements'] = len(select_elements)
            
            # Look for AI-related functionality
            ai_elements = self.driver.find_elements(By.XPATH, "//*[contains(text(), 'AI') or contains(text(), 'Gemini') or contains(text(), 'recommendation')]")
            results['results']['ai_features_present'] = len(ai_elements) > 0
            
            # Test form type selection if available
            try:
                # Look for enhanced consultation option
                enhanced_buttons = self.driver.find_elements(By.XPATH, "//*[contains(text(), 'Enhanced') or contains(text(), 'AI')]")
                results['results']['enhanced_consultation_available'] = len(enhanced_buttons) > 0
            except Exception as e:
                results['results']['form_selection_error'] = str(e)
        
        except Exception as e:
            results['error'] = str(e)
            logger.error(f"Consultation workflow test failed: {e}")
        
        self.test_results['consultation_workflow'] = results
        return results

    def test_offline_functionality_simulation(self):
        """Simulate offline functionality testing"""
        results = {
            'test_name': 'offline_functionality_simulation',
            'timestamp': datetime.now().isoformat(),
            'results': {}
        }
        
        if not self.driver:
            results['error'] = 'WebDriver not available'
            return results
        
        try:
            # Load the main page first
            self.driver.get(self.base_url)
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            # Simulate offline condition using Chrome DevTools
            self.driver.execute_cdp_cmd('Network.enable', {})
            self.driver.execute_cdp_cmd('Network.emulateNetworkConditions', {
                'offline': True,
                'downloadThroughput': 0,
                'uploadThroughput': 0,
                'latency': 0
            })
            
            # Test navigation while "offline"
            offline_results = {}
            
            # Try navigating to different pages
            test_pages = ['/dashboard', '/patients', '/consultation/new']
            
            for page in test_pages:
                try:
                    self.driver.get(f"{self.base_url}{page}")
                    time.sleep(2)  # Wait for potential cache loading
                    
                    # Check if page loaded (even from cache)
                    body_text = self.driver.find_element(By.TAG_NAME, "body").text
                    offline_results[f'offline_page_{page}'] = {
                        'loaded': len(body_text) > 100,  # Basic content check
                        'has_content': 'error' not in body_text.lower() or 'not found' not in body_text.lower()
                    }
                except Exception as e:
                    offline_results[f'offline_page_{page}'] = {
                        'loaded': False,
                        'error': str(e)
                    }
            
            # Re-enable network
            self.driver.execute_cdp_cmd('Network.emulateNetworkConditions', {
                'offline': False,
                'downloadThroughput': -1,
                'uploadThroughput': -1,
                'latency': 0
            })
            self.driver.execute_cdp_cmd('Network.disable', {})
            
            results['results'] = offline_results
            
        except Exception as e:
            results['error'] = str(e)
            logger.error(f"Offline functionality test failed: {e}")
        
        self.test_results['offline_functionality'] = results
        return results

    def run_lighthouse_audit(self):
        """Run Lighthouse audit on the application"""
        results = {
            'test_name': 'lighthouse_audit',
            'timestamp': datetime.now().isoformat(),
            'results': {}
        }
        
        try:
            # Run Lighthouse CLI
            lighthouse_cmd = [
                'lighthouse', 
                self.base_url,
                '--only-categories=performance,pwa,accessibility,best-practices',
                '--form-factor=mobile',
                '--output=json',
                '--output-path=./lighthouse_results.json',
                '--chrome-flags=--headless'
            ]
            
            process = subprocess.run(lighthouse_cmd, capture_output=True, text=True, timeout=120)
            
            if process.returncode == 0:
                # Load results
                with open('./lighthouse_results.json', 'r') as f:
                    lighthouse_data = json.load(f)
                
                # Extract key metrics
                categories = lighthouse_data.get('categories', {})
                audits = lighthouse_data.get('audits', {})
                
                results['results'] = {
                    'pwa_score': categories.get('pwa', {}).get('score', 0) * 100,
                    'performance_score': categories.get('performance', {}).get('score', 0) * 100,
                    'accessibility_score': categories.get('accessibility', {}).get('score', 0) * 100,
                    'best_practices_score': categories.get('best-practices', {}).get('score', 0) * 100,
                    'first_contentful_paint': audits.get('first-contentful-paint', {}).get('numericValue', 0) / 1000,
                    'time_to_interactive': audits.get('interactive', {}).get('numericValue', 0) / 1000,
                    'cumulative_layout_shift': audits.get('cumulative-layout-shift', {}).get('numericValue', 0),
                    'largest_contentful_paint': audits.get('largest-contentful-paint', {}).get('numericValue', 0) / 1000
                }
                
                results['success'] = True
                
            else:
                results['error'] = f"Lighthouse failed: {process.stderr}"
                logger.error(f"Lighthouse audit failed: {process.stderr}")
        
        except FileNotFoundError:
            results['error'] = "Lighthouse CLI not found. Please install: npm install -g lighthouse"
        except subprocess.TimeoutExpired:
            results['error'] = "Lighthouse audit timed out"
        except Exception as e:
            results['error'] = str(e)
            logger.error(f"Lighthouse audit failed: {e}")
        
        self.test_results['lighthouse_audit'] = results
        return results

    def generate_test_report(self):
        """Generate comprehensive test report"""
        report = {
            'atlas_testing_report': {
                'application_url': self.base_url,
                'test_timestamp': self.timestamp,
                'tests_completed': list(self.test_results.keys()),
                'summary': self.calculate_test_summary()
            },
            'detailed_results': self.test_results
        }
        
        return report

    def calculate_test_summary(self):
        """Calculate overall test summary"""
        summary = {
            'total_tests': len(self.test_results),
            'successful_tests': 0,
            'failed_tests': 0,
            'tests_with_errors': 0,
            'overall_health_score': 0
        }
        
        health_scores = []
        
        for test_name, test_data in self.test_results.items():
            if 'error' in test_data:
                summary['tests_with_errors'] += 1
            else:
                summary['successful_tests'] += 1
                
                # Calculate health score for each test
                if test_name == 'accessibility':
                    accessible_pages = sum(1 for k, v in test_data['results'].items() 
                                         if k.endswith('_accessible') and v)
                    total_pages = sum(1 for k in test_data['results'].keys() 
                                    if k.endswith('_accessible'))
                    if total_pages > 0:
                        health_scores.append((accessible_pages / total_pages) * 100)
                
                elif test_name == 'lighthouse_audit' and 'results' in test_data:
                    lighthouse_scores = [
                        test_data['results'].get('pwa_score', 0),
                        test_data['results'].get('performance_score', 0),
                        test_data['results'].get('accessibility_score', 0)
                    ]
                    health_scores.append(np.mean(lighthouse_scores))
                
                elif test_name == 'pwa_functionality':
                    pwa_checks = [
                        test_data['results'].get('manifest_accessible', False),
                        test_data['results'].get('service_worker', {}).get('active', False),
                        test_data['results'].get('storage_capabilities', {}).get('indexedDB', False)
                    ]
                    health_scores.append((sum(pwa_checks) / len(pwa_checks)) * 100)
        
        summary['failed_tests'] = summary['total_tests'] - summary['successful_tests'] - summary['tests_with_errors']
        
        if health_scores:
            summary['overall_health_score'] = np.mean(health_scores)
        
        return summary

    def save_results(self, output_dir='./live_test_results'):
        """Save test results to files"""
        Path(output_dir).mkdir(exist_ok=True)
        
        # Generate and save report
        report = self.generate_test_report()
        
        # Save JSON report
        with open(f'{output_dir}/atlas_live_test_report.json', 'w') as f:
            json.dump(report, f, indent=2, default=str)
        
        # Save summary CSV
        summary_data = []
        for test_name, test_data in self.test_results.items():
            summary_data.append({
                'test_name': test_name,
                'timestamp': test_data.get('timestamp', ''),
                'success': 'error' not in test_data,
                'error': test_data.get('error', '')
            })
        
        pd.DataFrame(summary_data).to_csv(f'{output_dir}/test_summary.csv', index=False)
        
        logger.info(f"Test results saved to {output_dir}/")
        return report

    def cleanup(self):
        """Clean up resources"""
        if self.driver:
            self.driver.quit()

def main():
    """Main execution function"""
    print("Starting ATLAS Live Application Testing...")
    print("=" * 60)
    
    tester = ATLASLiveTester()
    
    try:
        # Run all tests
        print("1. Testing application accessibility...")
        tester.test_application_accessibility()
        
        print("2. Testing PWA functionality...")
        tester.test_pwa_functionality()
        
        print("3. Testing UI responsiveness...")
        tester.test_user_interface_responsiveness()
        
        print("4. Testing patient management workflow...")
        tester.test_patient_management_workflow()
        
        print("5. Testing consultation workflow...")
        tester.test_consultation_workflow()
        
        print("6. Testing offline functionality simulation...")
        tester.test_offline_functionality_simulation()
        
        print("7. Running Lighthouse audit...")
        tester.run_lighthouse_audit()
        
        # Generate and save results
        print("\n8. Generating test report...")
        report = tester.save_results()
        
        # Print summary
        print("\n" + "=" * 60)
        print("ATLAS LIVE TESTING COMPLETE")
        print("=" * 60)
        
        summary = report['atlas_testing_report']['summary']
        print(f"Total Tests: {summary['total_tests']}")
        print(f"Successful Tests: {summary['successful_tests']}")
        print(f"Failed Tests: {summary['failed_tests']}")
        print(f"Tests with Errors: {summary['tests_with_errors']}")
        print(f"Overall Health Score: {summary['overall_health_score']:.1f}%")
        
        print("\nDetailed results saved in ./live_test_results/")
        print("=" * 60)
        
    except Exception as e:
        logger.error(f"Testing failed: {e}")
        print(f"Testing failed: {e}")
    
    finally:
        tester.cleanup()

if __name__ == "__main__":
    main()