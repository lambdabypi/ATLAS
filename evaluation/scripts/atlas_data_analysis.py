# ATLAS Data Analysis Scripts
# Supporting the methodology section data analysis plan

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats
import json
from datetime import datetime
import requests
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

# =============================================================================
# 1. AUTOMATED PERFORMANCE DATA COLLECTION
# =============================================================================

class ATLASPerformanceAnalyzer:
    """Analyze performance metrics from ATLAS application"""
    
    def __init__(self, app_url="https://atlas-clinical-git-main-lambdabypis-projects.vercel.app/"):
        self.app_url = app_url
        self.performance_data = {}
        
    def collect_lighthouse_data(self, lighthouse_json_file):
        """Process Lighthouse CI JSON output"""
        with open(lighthouse_json_file, 'r') as f:
            lighthouse_data = json.load(f)
        
        # Extract key metrics
        metrics = {
            'pwa_score': lighthouse_data.get('categories', {}).get('pwa', {}).get('score', 0) * 100,
            'performance_score': lighthouse_data.get('categories', {}).get('performance', {}).get('score', 0) * 100,
            'first_contentful_paint': lighthouse_data.get('audits', {}).get('first-contentful-paint', {}).get('numericValue', 0) / 1000,
            'time_to_interactive': lighthouse_data.get('audits', {}).get('interactive', {}).get('numericValue', 0) / 1000,
            'cumulative_layout_shift': lighthouse_data.get('audits', {}).get('cumulative-layout-shift', {}).get('numericValue', 0),
        }
        
        return metrics
    
    def simulate_network_conditions(self):
        """Simulate different network conditions for testing"""
        network_conditions = {
            '4G_urban': {'bandwidth': 12000, 'latency': 50},  # Kbps, ms
            '3G_rural': {'bandwidth': 1500, 'latency': 200},
            '2G_remote': {'bandwidth': 150, 'latency': 500},
            'offline': {'bandwidth': 0, 'latency': 0}
        }
        return network_conditions
    
    def analyze_performance_metrics(self, metrics_data):
        """Analyze performance metrics against targets"""
        targets = {
            'pwa_score': 90,
            'performance_score': 80,
            'first_contentful_paint': 2.0,  # seconds
            'time_to_interactive': 3.0,  # seconds
            'offline_success_rate': 95.0  # percentage
        }
        
        results = {}
        for metric, target in targets.items():
            if metric in metrics_data:
                actual = metrics_data[metric]
                results[metric] = {
                    'actual': actual,
                    'target': target,
                    'meets_target': actual >= target if metric in ['pwa_score', 'performance_score', 'offline_success_rate'] 
                                   else actual <= target,
                    'variance_percent': ((actual - target) / target) * 100
                }
        
        return results
    
    def generate_performance_report(self, metrics_data):
        """Generate performance analysis report"""
        analysis = self.analyze_performance_metrics(metrics_data)
        
        report = {
            'timestamp': datetime.now().isoformat(),
            'app_url': self.app_url,
            'metrics_analysis': analysis,
            'summary': {
                'total_metrics': len(analysis),
                'targets_met': sum(1 for m in analysis.values() if m['meets_target']),
                'overall_score': (sum(1 for m in analysis.values() if m['meets_target']) / len(analysis)) * 100
            }
        }
        
        return report

# =============================================================================
# 2. SYNTHETIC CLINICAL DATA ANALYSIS
# =============================================================================

class ClinicalScenarioAnalyzer:
    """Analyze synthetic clinical scenario testing results"""
    
    def __init__(self):
        self.scenario_categories = ['WHO_IMCI', 'Maternal_Health', 'General_Medicine', 'Emergency']
        
    def create_synthetic_scenarios(self, count_per_category=25):
        """Generate synthetic clinical scenarios for testing"""
        scenarios = []
        
        scenario_templates = {
            'WHO_IMCI': [
                {'age': '2 years', 'symptoms': 'fever, cough, fast breathing', 'expected': 'pneumonia_protocol'},
                {'age': '8 months', 'symptoms': 'diarrhea, dehydration signs', 'expected': 'diarrhea_management'},
                {'age': '18 months', 'symptoms': 'fever, lethargy, poor feeding', 'expected': 'serious_infection'},
            ],
            'Maternal_Health': [
                {'age': '28 years', 'gestation': '36 weeks', 'symptoms': 'severe headache, BP 160/110', 'expected': 'preeclampsia_management'},
                {'age': '22 years', 'gestation': '20 weeks', 'symptoms': 'bleeding, cramping', 'expected': 'threatened_abortion'},
                {'age': '35 years', 'gestation': '28 weeks', 'symptoms': 'decreased fetal movement', 'expected': 'fetal_monitoring'},
            ],
            'General_Medicine': [
                {'age': '45 years', 'symptoms': 'chest pain, shortness of breath', 'expected': 'cardiac_evaluation'},
                {'age': '60 years', 'symptoms': 'chronic cough, weight loss', 'expected': 'TB_screening'},
                {'age': '35 years', 'symptoms': 'polyuria, polydipsia, weight loss', 'expected': 'diabetes_screening'},
            ],
            'Emergency': [
                {'age': '25 years', 'symptoms': 'unconscious, fever, neck stiffness', 'expected': 'meningitis_protocol'},
                {'age': '55 years', 'symptoms': 'severe chest pain, sweating', 'expected': 'MI_protocol'},
                {'age': '30 years', 'symptoms': 'severe abdominal pain, guarding', 'expected': 'acute_abdomen'},
            ]
        }
        
        scenario_id = 1
        for category, templates in scenario_templates.items():
            for i in range(count_per_category):
                template = templates[i % len(templates)]  # Cycle through templates
                scenario = {
                    'id': scenario_id,
                    'category': category,
                    'patient_age': template['age'],
                    'symptoms': template['symptoms'],
                    'expected_protocol': template['expected'],
                    'resource_level': np.random.choice(['basic', 'intermediate', 'advanced']),
                    'created_at': datetime.now().isoformat()
                }
                scenarios.append(scenario)
                scenario_id += 1
        
        return pd.DataFrame(scenarios)
    
    def analyze_who_alignment(self, results_df):
        """Analyze AI recommendations against WHO protocol alignment"""
        alignment_analysis = {}
        
        for category in self.scenario_categories:
            category_data = results_df[results_df['category'] == category]
            
            alignment_analysis[category] = {
                'total_cases': len(category_data),
                'who_aligned': len(category_data[category_data['who_aligned'] == True]),
                'alignment_percentage': (len(category_data[category_data['who_aligned'] == True]) / len(category_data)) * 100,
                'appropriate_recommendations': len(category_data[category_data['appropriate_recommendation'] == True]),
                'appropriateness_percentage': (len(category_data[category_data['appropriate_recommendation'] == True]) / len(category_data)) * 100,
                'resource_aware': len(category_data[category_data['resource_aware'] == True]),
                'resource_awareness_percentage': (len(category_data[category_data['resource_aware'] == True]) / len(category_data)) * 100
            }
        
        return alignment_analysis
    
    def calculate_clinical_metrics(self, results_df):
        """Calculate clinical accuracy metrics"""
        # Confusion matrix for WHO alignment
        tp = len(results_df[(results_df['who_aligned'] == True) & (results_df['expected_alignment'] == True)])
        fp = len(results_df[(results_df['who_aligned'] == True) & (results_df['expected_alignment'] == False)])
        tn = len(results_df[(results_df['who_aligned'] == False) & (results_df['expected_alignment'] == False)])
        fn = len(results_df[(results_df['who_aligned'] == False) & (results_df['expected_alignment'] == True)])
        
        metrics = {
            'accuracy': (tp + tn) / (tp + fp + tn + fn),
            'precision': tp / (tp + fp) if (tp + fp) > 0 else 0,
            'recall': tp / (tp + fn) if (tp + fn) > 0 else 0,
            'specificity': tn / (tn + fp) if (tn + fp) > 0 else 0,
            'f1_score': 2 * ((tp / (tp + fp)) * (tp / (tp + fn))) / ((tp / (tp + fp)) + (tp / (tp + fn))) if tp > 0 else 0
        }
        
        return metrics

# =============================================================================
# 3. EXPERT EVALUATION DATA ANALYSIS
# =============================================================================

class ExpertEvaluationAnalyzer:
    """Analyze expert evaluation survey data"""
    
    def __init__(self):
        self.evaluation_categories = [
            'clinical_appropriateness',
            'technical_implementation', 
            'implementation_feasibility',
            'overall_assessment'
        ]
    
    def create_expert_survey_template(self):
        """Create structured expert evaluation survey template"""
        survey_template = {
            'expert_demographics': {
                'expert_id': '',
                'expert_type': '',  # Clinical, Global Health, Digital Health
                'years_experience': 0,
                'resource_limited_experience': True/False,
                'evaluation_date': ''
            },
            'clinical_appropriateness': {
                'safety_assessment': 0,  # 1-10 scale
                'diagnostic_accuracy': 0,  # 1-10 scale
                'treatment_recommendations': 0,  # 1-10 scale
                'clinical_workflow_integration': 0,  # 1-10 scale
                'comments': ''
            },
            'technical_implementation': {
                'user_interface_design': 0,  # 1-10 scale
                'offline_functionality': 0,  # 1-10 scale
                'performance_characteristics': 0,  # 1-10 scale
                'system_reliability': 0,  # 1-10 scale
                'comments': ''
            },
            'implementation_feasibility': {
                'deployment_requirements': 0,  # 1-10 scale
                'training_needs': 0,  # 1-10 scale (lower = less training needed)
                'sustainability_factors': 0,  # 1-10 scale
                'cost_effectiveness': 0,  # 1-10 scale
                'comments': ''
            },
            'overall_assessment': {
                'system_usability_scale': 0,  # SUS score 0-100
                'recommendation_likelihood': 0,  # 1-10 scale
                'deployment_readiness': 0,  # 1-10 scale
                'overall_satisfaction': 0,  # 1-10 scale
                'comments': ''
            }
        }
        return survey_template
    
    def analyze_expert_responses(self, expert_responses_df):
        """Analyze expert evaluation responses - with empty data handling"""
        analysis = {}
        
        # Check if we have any data
        if expert_responses_df.empty:
            print("   ⚠️ No expert evaluation data available - using placeholder")
            return {
                'response_summary': {
                    'total_experts': 0,
                    'expert_types': {},
                    'avg_years_experience': 0,
                    'resource_limited_experience_pct': 0,
                    'note': 'No expert evaluation data collected yet'
                },
                'sus_analysis': {
                    'mean_sus': 0,
                    'std_sus': 0,
                    'sus_grade': 'N/A',
                    'above_average': 0,
                    'note': 'Expert evaluation pending'
                }
            }
        
        # Original analysis code for when we have data
        analysis['response_summary'] = {
            'total_experts': len(expert_responses_df),
            'expert_types': expert_responses_df.get('expert_type', pd.Series()).value_counts().to_dict(),
            'avg_years_experience': expert_responses_df.get('years_experience', pd.Series()).mean(),
            'resource_limited_experience_pct': (expert_responses_df.get('resource_limited_experience', pd.Series()).sum() / len(expert_responses_df)) * 100 if len(expert_responses_df) > 0 else 0
        }
        
        # SUS analysis if available
        if 'overall_assessment_system_usability_scale' in expert_responses_df.columns:
            sus_scores = expert_responses_df['overall_assessment_system_usability_scale']
            analysis['sus_analysis'] = {
                'mean_sus': sus_scores.mean(),
                'std_sus': sus_scores.std(),
                'sus_grade': self.calculate_sus_grade(sus_scores.mean()),
                'above_average': len(sus_scores[sus_scores > 70]) / len(sus_scores) * 100
            }
        else:
            analysis['sus_analysis'] = {
                'mean_sus': 0,
                'std_sus': 0,
                'sus_grade': 'N/A',
                'above_average': 0,
                'note': 'SUS data not available'
            }
        
        return analysis
    
    def calculate_sus_grade(self, sus_score):
        """Calculate SUS grade based on score"""
        if sus_score >= 85: return 'A'
        elif sus_score >= 80: return 'B'
        elif sus_score >= 70: return 'C'
        elif sus_score >= 50: return 'D'
        else: return 'F'
    
    def perform_thematic_analysis(self, comments_data):
        """Perform rapid thematic analysis on expert comments"""
        # Simple keyword-based thematic analysis
        themes = {
            'usability': ['easy', 'intuitive', 'user-friendly', 'simple', 'complex', 'difficult'],
            'clinical_safety': ['safe', 'dangerous', 'risk', 'accurate', 'error', 'mistake'],
            'technical_issues': ['bug', 'crash', 'slow', 'fast', 'reliable', 'unstable'],
            'deployment_concerns': ['training', 'cost', 'infrastructure', 'support', 'maintenance'],
            'positive_feedback': ['excellent', 'good', 'helpful', 'useful', 'valuable'],
            'negative_feedback': ['poor', 'bad', 'problematic', 'concerning', 'inadequate']
        }
        
        thematic_results = {}
        for theme, keywords in themes.items():
            thematic_results[theme] = {
                'mentions': 0,
                'examples': []
            }
            
            for comment in comments_data:
                if comment and isinstance(comment, str):
                    comment_lower = comment.lower()
                    for keyword in keywords:
                        if keyword in comment_lower:
                            thematic_results[theme]['mentions'] += 1
                            if len(thematic_results[theme]['examples']) < 3:
                                thematic_results[theme]['examples'].append(comment[:100] + "...")
                            break
        
        return thematic_results

# =============================================================================
# 4. FRAMEWORK ASSESSMENT ANALYSIS
# =============================================================================

class FrameworkAssessmentAnalyzer:
    """Analyze NASSS and RE-AIM framework assessments"""
    
    def __init__(self):
        self.nasss_domains = [
            'technology', 'value_proposition', 'adopters', 
            'organization', 'wider_system', 'embedding', 'adaptation'
        ]
        self.reaim_dimensions = ['reach', 'effectiveness', 'adoption', 'implementation', 'maintenance']
    
    def calculate_nasss_scores(self, assessment_data):
        """Calculate NASSS complexity scores"""
        nasss_scores = {}
        
        for domain in self.nasss_domains:
            if domain in assessment_data:
                domain_score = assessment_data[domain]
                nasss_scores[domain] = {
                    'score': domain_score,
                    'complexity_level': self.get_nasss_complexity_level(domain_score)
                }
        
        # Calculate overall complexity
        avg_score = np.mean([scores['score'] for scores in nasss_scores.values()])
        nasss_scores['overall'] = {
            'score': avg_score,
            'complexity_level': self.get_nasss_complexity_level(avg_score)
        }
        
        return nasss_scores
    
    def get_nasss_complexity_level(self, score):
        """Convert NASSS score to complexity level"""
        if score <= 2: return 'Simple'
        elif score <= 3: return 'Complicated'
        elif score <= 4: return 'Complex'
        else: return 'Chaotic'
    
    def calculate_reaim_scores(self, assessment_data):
        """Calculate RE-AIM dimension scores"""
        reaim_scores = {}
        
        for dimension in self.reaim_dimensions:
            if dimension in assessment_data:
                dimension_score = assessment_data[dimension]
                reaim_scores[dimension] = {
                    'score': dimension_score,
                    'readiness_level': self.get_reaim_readiness_level(dimension_score)
                }
        
        # Calculate overall readiness
        avg_score = np.mean([scores['score'] for scores in reaim_scores.values()])
        reaim_scores['overall'] = {
            'score': avg_score,
            'readiness_level': self.get_reaim_readiness_level(avg_score)
        }
        
        return reaim_scores
    
    def get_reaim_readiness_level(self, score):
        """Convert RE-AIM score to readiness level"""
        if score >= 8: return 'High Readiness'
        elif score >= 6: return 'Moderate Readiness'
        elif score >= 4: return 'Low Readiness'
        else: return 'Not Ready'
    
    def generate_framework_report(self, nasss_data, reaim_data):
        """Generate comprehensive framework assessment report"""
        nasss_analysis = self.calculate_nasss_scores(nasss_data)
        reaim_analysis = self.calculate_reaim_scores(reaim_data)
        
        report = {
            'assessment_date': datetime.now().isoformat(),
            'nasss_assessment': nasss_analysis,
            'reaim_assessment': reaim_analysis,
            'implementation_recommendations': self.generate_implementation_recommendations(
                nasss_analysis, reaim_analysis
            ),
            'readiness_decision': self.make_readiness_decision(nasss_analysis, reaim_analysis)
        }
        
        return report
    
    def generate_implementation_recommendations(self, nasss_analysis, reaim_analysis):
        """Generate implementation recommendations based on framework scores"""
        recommendations = []
        
        # NASSS-based recommendations
        for domain, scores in nasss_analysis.items():
            if domain != 'overall' and scores['score'] >= 4:
                recommendations.append(f"Address high complexity in {domain}: requires significant attention before deployment")
        
        # RE-AIM-based recommendations  
        for dimension, scores in reaim_analysis.items():
            if dimension != 'overall' and scores['score'] <= 4:
                recommendations.append(f"Improve {dimension} dimension: score below implementation threshold")
        
        return recommendations
    
    def make_readiness_decision(self, nasss_analysis, reaim_analysis):
        """Make implementation readiness decision"""
        nasss_score = nasss_analysis['overall']['score']
        reaim_score = reaim_analysis['overall']['score']
        
        if nasss_score <= 3 and reaim_score >= 6:
            return "Ready for pilot implementation"
        elif nasss_score <= 4 and reaim_score >= 4:
            return "Ready with modifications"
        else:
            return "Requires significant development before implementation"

# =============================================================================
# 5. INTEGRATED ANALYSIS AND REPORTING
# =============================================================================

class ATLASIntegratedAnalyzer:
    """Integrated analysis of all ATLAS evaluation data"""
    
    def __init__(self):
        self.performance_analyzer = ATLASPerformanceAnalyzer()
        self.clinical_analyzer = ClinicalScenarioAnalyzer()
        self.expert_analyzer = ExpertEvaluationAnalyzer()
        self.framework_analyzer = FrameworkAssessmentAnalyzer()
    
    def generate_comprehensive_report(self, all_data):
        """Generate comprehensive evaluation report"""
        report = {
            'evaluation_summary': {
                'evaluation_date': datetime.now().isoformat(),
                'app_url': self.performance_analyzer.app_url,
                'evaluation_components': [
                    'Technical Performance',
                    'Clinical Validation', 
                    'Expert Evaluation',
                    'Framework Assessment'
                ]
            },
            'technical_performance': self.performance_analyzer.generate_performance_report(
                all_data.get('performance_metrics', {})
            ),
            'clinical_validation': self.clinical_analyzer.analyze_who_alignment(
                all_data.get('clinical_results', pd.DataFrame())
            ),
            'expert_evaluation': self.expert_analyzer.analyze_expert_responses(
                all_data.get('expert_responses', pd.DataFrame())
            ),
            'framework_assessment': self.framework_analyzer.generate_framework_report(
                all_data.get('nasss_data', {}),
                all_data.get('reaim_data', {})
            )
        }
        
        # Add integrated conclusions
        report['integrated_conclusions'] = self.draw_integrated_conclusions(report)
        
        return report
    
    def draw_integrated_conclusions(self, report_data):
        """Draw integrated conclusions across all evaluation dimensions"""
        conclusions = {
            'overall_assessment': '',
            'key_achievements': [],
            'primary_limitations': [],
            'readiness_indicators': {},
            'future_priorities': []
        }
        
        # Analyze technical readiness
        tech_performance = report_data.get('technical_performance', {})
        if tech_performance.get('summary', {}).get('overall_score', 0) >= 75:
            conclusions['key_achievements'].append('Strong technical performance across PWA metrics')
        
        # Analyze clinical validation
        clinical_data = report_data.get('clinical_validation', {})
        # Add clinical assessment logic based on WHO alignment scores
        
        # Analyze expert feedback
        expert_data = report_data.get('expert_evaluation', {})
        if expert_data.get('sus_analysis', {}).get('mean_sus', 0) >= 70:
            conclusions['key_achievements'].append('Above-average usability scores from expert evaluation')
        
        # Analyze framework readiness
        framework_data = report_data.get('framework_assessment', {})
        readiness_decision = framework_data.get('readiness_decision', '')
        conclusions['readiness_indicators']['framework_decision'] = readiness_decision
        
        return conclusions

# =============================================================================
# 6. VISUALIZATION AND OUTPUT GENERATION
# =============================================================================

def generate_evaluation_visualizations(report_data):
    """Generate comprehensive visualizations for evaluation results"""
    
    fig, axes = plt.subplots(2, 3, figsize=(18, 12))
    fig.suptitle('ATLAS Evaluation Results Dashboard', fontsize=16, fontweight='bold')
    
    # 1. PWA Performance Metrics
    performance_data = report_data.get('technical_performance', {}).get('metrics_analysis', {})
    if performance_data:
        metrics = list(performance_data.keys())
        actual_scores = [performance_data[m]['actual'] for m in metrics]
        target_scores = [performance_data[m]['target'] for m in metrics]
        
        x = np.arange(len(metrics))
        width = 0.35
        
        axes[0,0].bar(x - width/2, actual_scores, width, label='Actual', alpha=0.8)
        axes[0,0].bar(x + width/2, target_scores, width, label='Target', alpha=0.8)
        axes[0,0].set_xlabel('Metrics')
        axes[0,0].set_ylabel('Scores')
        axes[0,0].set_title('Technical Performance vs Targets')
        axes[0,0].set_xticks(x)
        axes[0,0].set_xticklabels(metrics, rotation=45, ha='right')
        axes[0,0].legend()
    
    # 2. Clinical Scenario Results
    clinical_data = report_data.get('clinical_validation', {})
    if clinical_data:
        categories = list(clinical_data.keys())
        who_alignment = [clinical_data[cat].get('alignment_percentage', 0) for cat in categories]
        
        axes[0,1].bar(categories, who_alignment, color='skyblue', alpha=0.8)
        axes[0,1].axhline(y=75, color='red', linestyle='--', alpha=0.7, label='Target (75%)')
        axes[0,1].set_xlabel('Clinical Categories')
        axes[0,1].set_ylabel('WHO Alignment %')
        axes[0,1].set_title('Clinical Scenario WHO Alignment')
        axes[0,1].tick_params(axis='x', rotation=45)
        axes[0,1].legend()
    
    # 3. Expert Evaluation SUS Scores
    expert_data = report_data.get('expert_evaluation', {})
    if expert_data.get('sus_analysis'):
        sus_score = expert_data['sus_analysis'].get('mean_sus', 0)
        sus_std = expert_data['sus_analysis'].get('std_sus', 0)
        
        axes[0,2].bar(['SUS Score'], [sus_score], yerr=[sus_std], 
                      color='lightgreen', alpha=0.8, capsize=5)
        axes[0,2].axhline(y=70, color='red', linestyle='--', alpha=0.7, label='Above Average (70)')
        axes[0,2].set_ylabel('SUS Score')
        axes[0,2].set_title('System Usability Scale')
        axes[0,2].set_ylim(0, 100)
        axes[0,2].legend()
    
    # 4. NASSS Complexity Heatmap
    framework_data = report_data.get('framework_assessment', {})
    nasss_data = framework_data.get('nasss_assessment', {})
    if nasss_data:
        domains = [d for d in nasss_data.keys() if d != 'overall']
        scores = [nasss_data[d]['score'] for d in domains]
        
        # Create heatmap data
        heatmap_data = np.array(scores).reshape(1, -1)
        im = axes[1,0].imshow(heatmap_data, cmap='RdYlGn_r', aspect='auto', vmin=1, vmax=5)
        axes[1,0].set_xticks(np.arange(len(domains)))
        axes[1,0].set_xticklabels(domains, rotation=45, ha='right')
        axes[1,0].set_yticks([])
        axes[1,0].set_title('NASSS Complexity Assessment')
        
        # Add colorbar
        cbar = plt.colorbar(im, ax=axes[1,0])
        cbar.set_label('Complexity Score')
    
    # 5. RE-AIM Readiness Radar Chart
    reaim_data = framework_data.get('reaim_assessment', {})
    if reaim_data:
        dimensions = [d for d in reaim_data.keys() if d != 'overall']
        scores = [reaim_data[d]['score'] for d in dimensions]
        
        # Create radar chart
        angles = np.linspace(0, 2 * np.pi, len(dimensions), endpoint=False).tolist()
        scores += scores[:1]  # Complete the circle
        angles += angles[:1]
        
        axes[1,1].plot(angles, scores, 'o-', linewidth=2, label='ATLAS Score')
        axes[1,1].fill(angles, scores, alpha=0.25)
        axes[1,1].set_xticks(angles[:-1])
        axes[1,1].set_xticklabels(dimensions)
        axes[1,1].set_ylim(0, 10)
        axes[1,1].set_title('RE-AIM Implementation Readiness')
        axes[1,1].grid(True)
    
    # 6. Overall Assessment Summary
    conclusions = report_data.get('integrated_conclusions', {})
    achievements = conclusions.get('key_achievements', [])
    limitations = conclusions.get('primary_limitations', [])
    
    # Create text summary
    summary_text = "KEY ACHIEVEMENTS:\n"
    for i, achievement in enumerate(achievements[:3], 1):
        summary_text += f"{i}. {achievement}\n"
    
    summary_text += "\nPRIMARY LIMITATIONS:\n"
    for i, limitation in enumerate(limitations[:3], 1):
        summary_text += f"{i}. {limitation}\n"
    
    axes[1,2].text(0.05, 0.95, summary_text, transform=axes[1,2].transAxes, 
                   fontsize=10, verticalalignment='top', bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.8))
    axes[1,2].set_xlim(0, 1)
    axes[1,2].set_ylim(0, 1)
    axes[1,2].axis('off')
    axes[1,2].set_title('Evaluation Summary')
    
    plt.tight_layout()
    return fig

def save_evaluation_report(report_data, output_dir='./evaluation_results'):
    """Save comprehensive evaluation report to files"""
    Path(output_dir).mkdir(exist_ok=True)
    
    # Save JSON report
    with open(f'{output_dir}/atlas_evaluation_report.json', 'w') as f:
        json.dump(report_data, f, indent=2, default=str)
    
    # Save CSV summaries
    # Performance metrics
    performance_data = report_data.get('technical_performance', {}).get('metrics_analysis', {})
    if performance_data:
        perf_df = pd.DataFrame.from_dict(performance_data, orient='index')
        perf_df.to_csv(f'{output_dir}/performance_metrics.csv')
    
    # Clinical results
    clinical_data = report_data.get('clinical_validation', {})
    if clinical_data:
        clinical_df = pd.DataFrame.from_dict(clinical_data, orient='index')
        clinical_df.to_csv(f'{output_dir}/clinical_validation_results.csv')
    
    # Framework assessments
    framework_data = report_data.get('framework_assessment', {})
    if framework_data:
        # NASSS scores
        nasss_data = framework_data.get('nasss_assessment', {})
        if nasss_data:
            nasss_df = pd.DataFrame.from_dict(nasss_data, orient='index')
            nasss_df.to_csv(f'{output_dir}/nasss_assessment.csv')
        
        # RE-AIM scores
        reaim_data = framework_data.get('reaim_assessment', {})
        if reaim_data:
            reaim_df = pd.DataFrame.from_dict(reaim_data, orient='index')
            reaim_df.to_csv(f'{output_dir}/reaim_assessment.csv')
    
    print(f"Evaluation report saved to {output_dir}/")

# =============================================================================
# 7. AUTOMATED TESTING SCRIPTS FOR ATLAS APPLICATION
# =============================================================================

def run_lighthouse_audit(url="https://atlas-clinical-git-main-lambdabypis-projects.vercel.app/"):
    """Run Lighthouse audit on ATLAS application - Fixed for v13+"""
    import subprocess
    import json
    import shutil
    import os
    
    # Try to find lighthouse executable
    lighthouse_cmd = None
    
    # Common locations for lighthouse on Windows
    possible_paths = [
        'lighthouse.cmd',  # Windows batch file (most likely)
        'lighthouse',  # If it's in PATH
        os.path.expanduser('~/AppData/Roaming/npm/lighthouse.cmd'),
        'npx lighthouse'
    ]
    
    for cmd in possible_paths:
        try:
            if cmd == 'npx lighthouse':
                result = subprocess.run(['npx', 'lighthouse', '--version'], 
                                      capture_output=True, text=True, timeout=10)
                if result.returncode == 0:
                    lighthouse_cmd = ['npx', 'lighthouse']
                    break
            else:
                result = subprocess.run([cmd, '--version'], 
                                      capture_output=True, text=True, timeout=10)
                if result.returncode == 0:
                    lighthouse_cmd = [cmd]
                    break
        except (subprocess.TimeoutExpired, FileNotFoundError, OSError):
            continue
    
    if not lighthouse_cmd:
        print("   ⚠️ Lighthouse command not found")
        return None
    
    # FIXED: Updated categories for Lighthouse v13+
    lighthouse_command = lighthouse_cmd + [
        url,
        '--only-categories=performance,best-practices,accessibility',  # Removed 'pwa'
        '--form-factor=mobile',
        '--output=json',
        '--output-path=./lighthouse_results.json',
        '--chrome-flags=--headless'
    ]
    
    try:
        print(f"   Running: {' '.join(lighthouse_command)}")
        subprocess.run(lighthouse_command, check=True, timeout=120)
        print(f"   ✓ Lighthouse audit completed for {url}")
        return './lighthouse_results.json'
    except subprocess.CalledProcessError as e:
        print(f"   ❌ Lighthouse audit failed: {e}")
        return None
    except subprocess.TimeoutExpired:
        print("   ⏰ Lighthouse audit timed out")
        return None
    except Exception as e:
        print(f"   ❌ Lighthouse error: {e}")
        return None

def test_pwa_offline_functionality(url="https://atlas-clinical-git-main-lambdabypis-projects.vercel.app/"):
    """Test PWA offline functionality using Puppeteer-like approach"""
    # This would typically use Puppeteer/Playwright for actual testing
    # Here's a conceptual framework for the tests
    
    offline_tests = {
        'cache_availability': {
            'test': 'Check if service worker caches critical resources',
            'expected': 'All critical assets cached',
            'result': 'TBD'  # To be filled by actual test
        },
        'offline_navigation': {
            'test': 'Navigate between pages while offline',
            'expected': 'All pages load from cache',
            'result': 'TBD'
        },
        'offline_data_persistence': {
            'test': 'Create and save patient data while offline',
            'expected': 'Data persists in IndexedDB',
            'result': 'TBD'
        },
        'offline_sync_queue': {
            'test': 'Actions queued when offline, sync when online',
            'expected': 'All queued actions sync successfully',
            'result': 'TBD'
        },
        'ai_offline_fallback': {
            'test': 'AI requests fail gracefully when offline',
            'expected': 'Fallback to local recommendations',
            'result': 'TBD'
        }
    }
    
    return offline_tests

def generate_synthetic_clinical_test_data():
    """Generate synthetic clinical test data for ATLAS evaluation"""
    analyzer = ClinicalScenarioAnalyzer()
    scenarios = analyzer.create_synthetic_scenarios(count_per_category=25)
    
    # Add expected results and validation criteria
    for idx, row in scenarios.iterrows():
        scenarios.at[idx, 'expected_alignment'] = True  # Assume WHO alignment expected
        scenarios.at[idx, 'test_status'] = 'pending'
        scenarios.at[idx, 'ai_response'] = ''
        scenarios.at[idx, 'who_aligned'] = None
        scenarios.at[idx, 'appropriate_recommendation'] = None
        scenarios.at[idx, 'resource_aware'] = None
        scenarios.at[idx, 'response_time_ms'] = None
    
    # Save test scenarios
    scenarios.to_csv('./test_scenarios.csv', index=False)
    print(f"Generated {len(scenarios)} synthetic clinical test scenarios")
    return scenarios

def run_ai_accuracy_testing(test_scenarios_df, atlas_api_endpoint=None):
    """Run AI accuracy testing against synthetic clinical scenarios"""
    # This would make actual API calls to your ATLAS system
    # For now, providing the framework for testing
    
    results = []
    
    for idx, scenario in test_scenarios_df.iterrows():
        test_result = {
            'scenario_id': scenario['id'],
            'category': scenario['category'],
            'test_input': f"Patient: {scenario['patient_age']}, Symptoms: {scenario['symptoms']}",
            'expected_protocol': scenario['expected_protocol'],
            'resource_level': scenario['resource_level']
        }
        
        # Simulate API call to ATLAS (replace with actual implementation)
        if atlas_api_endpoint:
            try:
                # Make actual API request here
                # response = requests.post(atlas_api_endpoint, json=test_input)
                # test_result.update(parse_atlas_response(response))
                pass
            except Exception as e:
                test_result['error'] = str(e)
        else:
            # Placeholder results for framework demonstration
            test_result.update({
                'ai_response': f'Simulated response for {scenario["expected_protocol"]}',
                'response_time_ms': np.random.normal(2000, 500),  # Simulate response time
                'who_aligned': np.random.choice([True, False], p=[0.8, 0.2]),  # 80% alignment
                'appropriate_recommendation': np.random.choice([True, False], p=[0.85, 0.15]),
                'resource_aware': np.random.choice([True, False], p=[0.75, 0.25])
            })
        
        results.append(test_result)
    
    results_df = pd.DataFrame(results)
    results_df.to_csv('./ai_testing_results.csv', index=False)
    return results_df

# =============================================================================
# 8. MAIN EXECUTION SCRIPT
# =============================================================================

def main_atlas_evaluation():
    """Main execution function for ATLAS evaluation"""
    print("Starting ATLAS Comprehensive Evaluation...")
    print("=" * 50)
    
    # Initialize analyzers
    integrated_analyzer = ATLASIntegratedAnalyzer()
    
    # 1. Generate synthetic test data
    print("1. Generating synthetic clinical test scenarios...")
    test_scenarios = generate_synthetic_clinical_test_data()
    print(f"   ✓ Generated {len(test_scenarios)} test scenarios")
    
    # 2. Run technical performance tests
    print("\n2. Running technical performance tests...")
    lighthouse_file = run_lighthouse_audit()
    if lighthouse_file:
        print("   ✓ Lighthouse audit completed")
    
    offline_tests = test_pwa_offline_functionality()
    print("   ✓ Offline functionality test framework prepared")
    
    # 3. Run AI accuracy testing
    print("\n3. Running AI accuracy testing...")
    ai_results = run_ai_accuracy_testing(test_scenarios)
    print(f"   ✓ Tested AI responses for {len(ai_results)} scenarios")
    
    # 4. Collect all evaluation data (this would be populated with actual results)
    evaluation_data = {
        'performance_metrics': {
            'pwa_score': 85,  # Example data - replace with actual results
            'performance_score': 78,
            'first_contentful_paint': 1.8,
            'time_to_interactive': 2.4,
            'offline_success_rate': 92
        },
        'clinical_results': ai_results,
        'expert_responses': pd.DataFrame(),  # Would contain actual expert survey data
        'nasss_data': {
            'technology': 2.5,
            'value_proposition': 3.0,
            'adopters': 3.5,
            'organization': 4.0,
            'wider_system': 3.0,
            'embedding': 3.5,
            'adaptation': 2.0
        },
        'reaim_data': {
            'reach': 7.0,
            'effectiveness': 6.5,
            'adoption': 5.0,
            'implementation': 4.5,
            'maintenance': 6.0
        }
    }
    
    # 5. Generate comprehensive report
    print("\n4. Generating comprehensive evaluation report...")
    comprehensive_report = integrated_analyzer.generate_comprehensive_report(evaluation_data)
    
    # 6. Create visualizations
    print("\n5. Creating evaluation visualizations...")
    fig = generate_evaluation_visualizations(comprehensive_report)
    fig.savefig('./evaluation_results/atlas_evaluation_dashboard.png', dpi=300, bbox_inches='tight')
    print("   ✓ Evaluation dashboard saved")
    
    # 7. Save all results
    print("\n6. Saving evaluation results...")
    save_evaluation_report(comprehensive_report)
    
    print("\n" + "=" * 50)
    print("ATLAS Evaluation Complete!")
    print("Results saved in ./evaluation_results/ directory")
    print("=" * 50)
    
    return comprehensive_report

# =============================================================================
# 9. R SCRIPT EQUIVALENT (For statistical analysis)
# =============================================================================

r_script_template = '''
# ATLAS Evaluation - R Statistical Analysis Script
# Companion to Python analysis for advanced statistical operations

library(tidyverse)
library(ggplot2)
library(plotly)
library(corrplot)
library(psych)
library(effsize)

# Load evaluation data
load_atlas_data <- function() {
  performance_data <- read.csv("./evaluation_results/performance_metrics.csv")
  clinical_data <- read.csv("./evaluation_results/clinical_validation_results.csv")
  nasss_data <- read.csv("./evaluation_results/nasss_assessment.csv")
  reaim_data <- read.csv("./evaluation_results/reaim_assessment.csv")
  
  return(list(
    performance = performance_data,
    clinical = clinical_data,
    nasss = nasss_data,
    reaim = reaim_data
  ))
}

# Statistical analysis functions
perform_clinical_accuracy_analysis <- function(clinical_data) {
  # Calculate confidence intervals for accuracy metrics
  accuracy_stats <- clinical_data %>%
    summarise(
      mean_who_alignment = mean(who_aligned, na.rm = TRUE),
      ci_lower = binom.test(sum(who_aligned, na.rm = TRUE), n())$conf.int[1],
      ci_upper = binom.test(sum(who_aligned, na.rm = TRUE), n())$conf.int[2],
      n_cases = n()
    )
  
  return(accuracy_stats)
}

# Framework correlation analysis
analyze_framework_correlations <- function(nasss_data, reaim_data) {
  # Merge framework scores
  framework_scores <- merge(nasss_data, reaim_data, by = "row.names")
  
  # Calculate correlations
  cor_matrix <- cor(framework_scores[sapply(framework_scores, is.numeric)], 
                    use = "complete.obs")
  
  # Visualize correlations
  corrplot(cor_matrix, method = "circle", type = "upper")
  
  return(cor_matrix)
}

# Main R analysis function
main_r_analysis <- function() {
  atlas_data <- load_atlas_data()
  
  # Clinical accuracy analysis
  clinical_stats <- perform_clinical_accuracy_analysis(atlas_data$clinical)
  
  # Framework analysis  
  framework_correlations <- analyze_framework_correlations(
    atlas_data$nasss, 
    atlas_data$reaim
  )
  
  # Generate R-specific visualizations
  # (Additional R plotting code would go here)
  
  return(list(
    clinical_stats = clinical_stats,
    framework_correlations = framework_correlations
  ))
}

# Execute R analysis
results <- main_r_analysis()
'''

# Save R script template
def save_r_analysis_script():
    """Save R analysis script template"""
    with open('./atlas_evaluation_analysis.R', 'w') as f:
        f.write(r_script_template)
    print("R analysis script saved as atlas_evaluation_analysis.R")

if __name__ == "__main__":
    # Run main evaluation
    evaluation_results = main_atlas_evaluation()
    
    # Save R script for advanced statistical analysis
    save_r_analysis_script()
    
    print("\nEvaluation framework ready!")
    print("Next steps:")
    print("1. Run actual Lighthouse audits on your deployed app")
    print("2. Implement API testing against your ATLAS endpoints") 
    print("3. Conduct expert evaluations using the survey template")
    print("4. Fill in actual NASSS and RE-AIM assessment scores")
    print("5. Run the analysis scripts to generate your thesis results")