
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
