# ATLAS Data Collection Implementation Guide

## Quick Start Timeline (November 1-24)

### Week 1: November 1-7
**Technical Performance & System Testing**
- [ ] Run automated performance tests using browser DevTools
- [ ] Test offline functionality across network conditions
- [ ] Generate synthetic clinical test data using your existing framework
- [ ] Document technical performance metrics

**Actions:**
1. Open ATLAS in Chrome DevTools → Lighthouse tab → Run performance audit
2. Test network throttling: 4G Urban → 3G Rural → 2G Remote → Offline
3. Record load times, memory usage, offline capability scores
4. Use your `atlas-testing-framework.js` for automated testing

### Week 2: November 8-14  
**Clinical Validation Testing**
- [ ] Run WHO clinical scenarios through ATLAS
- [ ] Use clinical validation forms to score AI responses
- [ ] Test maternal health, IMCI, and ANC scenarios
- [ ] Document accuracy and guideline compliance

**Actions:**
1. Load clinical validation forms in browser
2. Run each WHO scenario through ATLAS
3. Score AI responses using the validation forms
4. Export clinical validation data for analysis

### Week 3: November 15-21
**Expert Evaluation**  
- [ ] Recruit 3-4 clinical experts using LinkedIn/professional networks
- [ ] Send expert evaluation survey links
- [ ] Conduct follow-up interviews if needed
- [ ] Collect and analyze expert feedback

**Expert Recruitment Email Template:**
```
Subject: Clinical Expert Evaluation - ATLAS Healthcare AI System ($100 Compensation)

Dear [Name],

I'm conducting research at Northeastern University on ATLAS, an AI-powered clinical decision support system for resource-limited settings. 

Would you be interested in evaluating the system? It involves:
- 60-90 minute online evaluation
- Testing clinical scenarios and providing expert feedback
- $100 gift card compensation

The system integrates WHO guidelines with AI for offline-capable clinical support.

Best regards,
Shreyas Sreenivas
```

### Week 4: November 22-28
**Framework Assessment & Data Analysis**
- [ ] Complete NASSS, RE-AIM, and WHO MAPS assessments
- [ ] Analyze all collected data
- [ ] Generate implementation recommendations
- [ ] Prepare data for thesis results chapter

## Data Collection Checklist

### Technical Performance Data
- [ ] Page load speeds (target: <3s on 3G)
- [ ] Offline functionality (target: >95% success)
- [ ] Memory usage (target: <100MB)
- [ ] Network efficiency (target: <5MB initial load)
- [ ] Synchronization performance
- [ ] Browser compatibility testing

### Clinical Validation Data  
- [ ] 40 IMCI scenarios (pneumonia, diarrhea, fever)
- [ ] 30 Maternal health scenarios (preeclampsia, normal ANC)
- [ ] 20 Infectious disease scenarios
- [ ] 10 NCD scenarios
- [ ] AI accuracy scores (target: >75%)
- [ ] WHO guideline compliance scores
- [ ] Response time measurements

### Expert Evaluation Data
- [ ] Expert demographics and experience
- [ ] System usability scores (target SUS: >70)
- [ ] Task completion rates
- [ ] Clinical scenario accuracy ratings
- [ ] Implementation feasibility scores
- [ ] Qualitative feedback and recommendations

### Framework Assessment Data
- [ ] NASSS complexity scores (7 domains)
- [ ] RE-AIM implementation potential (5 dimensions)
- [ ] WHO MAPS scale readiness (6 components)
- [ ] Overall implementation readiness score
- [ ] Risk factors and mitigation strategies

## Sample Size Justification (From Your Thesis)

✅ **Technical tests**: 500+ automated test runs across network conditions
✅ **Clinical scenarios**: 150 cases (100 WHO-validated + 50 Synthea-generated)  
✅ **Expert evaluators**: 3-4 focused qualitative insights
✅ **Framework assessments**: 3 established frameworks

This is appropriate for proof-of-concept demonstration rather than clinical trials.

## Data Analysis Strategy

### Quantitative Analysis (R/Python)
```r
# Technical Performance Analysis
performance_data <- read.csv("atlas_performance_metrics.csv")
summary_stats <- performance_data %>% 
  summarise(
    avg_load_time = mean(load_time),
    offline_success_rate = mean(offline_capable),
    memory_usage_p95 = quantile(memory_mb, 0.95)
  )

# Clinical Accuracy Analysis  
clinical_data <- read.csv("atlas_clinical_validation.csv")
accuracy_by_category <- clinical_data %>%
  group_by(scenario_category) %>%
  summarise(
    avg_accuracy = mean(accuracy_score),
    guideline_compliance = mean(compliance_score)
  )
```

### Qualitative Analysis
- Thematic analysis of expert feedback
- Identification of usability barriers
- Implementation recommendations synthesis

## Success Criteria Tracking

| Criterion | Target | Current Status | Notes |
|-----------|---------|----------------|--------|
| **Technical Performance** | <3s load on 3G | ⏳ Testing | Lighthouse audit |
| **Clinical Accuracy** | >75% WHO alignment | ⏳ Testing | Clinical scenarios |
| **Usability (SUS)** | >70 score | ⏳ Testing | Expert evaluation |
| **Implementation Readiness** | Framework assessment | ⏳ Testing | NASSS/RE-AIM/MAPS |

## Potential Challenges & Solutions

### Challenge: Low Expert Response Rate
**Solutions:**
- Offer higher compensation ($150 vs $100)
- Use warm introductions through advisors
- Reduce time commitment (45 minutes vs 90)
- Target specific specialties (global health, emergency medicine)

### Challenge: Limited Clinical Scenarios
**Solutions:**
- Use existing WHO Digital Adaptation Kits
- Generate synthetic scenarios with Synthea
- Focus on highest-priority use cases (maternal health, IMCI)
- Validate with published case studies

### Challenge: Technical Testing Complexity
**Solutions:**  
- Use automated testing frameworks already built
- Focus on key metrics (load time, offline capability)
- Document limitations clearly in thesis
- Prioritize user-facing performance over backend metrics

## Data Management & Ethics

### Data Storage
- All data encrypted and password-protected
- Expert data anonymized with ID codes
- No real patient data used
- GitHub private repo for code/data

### Consent & Ethics
- IRB exemption obtained (no patient interaction)
- Expert informed consent required
- Clear data use explanation
- Withdrawal permitted at any time

## Quality Assurance

### Validation Checks
- [ ] Cross-check clinical scenarios against WHO guidelines
- [ ] Verify expert evaluation survey logic and scoring
- [ ] Test all data export functions
- [ ] Backup data collection procedures

### Reliability Measures
- [ ] Inter-rater reliability for clinical scenarios
- [ ] Test-retest reliability for technical metrics  
- [ ] Internal consistency checks (Cronbach's alpha)

## Export & Backup Strategy

1. **Daily Backups**: All data to encrypted cloud storage
2. **Multiple Formats**: JSON, CSV, and text exports
3. **Version Control**: Git tracking for all templates and data
4. **Documentation**: Detailed methodology documentation

## Timeline Buffer

Built-in buffers for common delays:
- Expert recruitment: Extra 1 week
- Technical issues: 3-day buffer per week  
- Data analysis: 5 days extra for R/Python analysis
- Thesis writing: 1-week buffer before deadline

---

**Contact Information:**
- Primary: shreyas.sreenivas@northeastern.edu
- Advisor: Dr. Sivarit Sultornsanee
- Emergency: [backup contact]

**Resources:**
- Data Collection Forms: [URLs to the three templates created]
- ATLAS System: [Your system URL]
- Technical Documentation: [GitHub repo]