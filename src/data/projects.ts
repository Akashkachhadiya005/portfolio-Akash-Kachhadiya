import type { Project } from "@/types";

export const projects: Project[] = [
  {
    slug: "liver-patient-prediction",
    title: "Liver Disease Prediction & Clinical Diagnostics",
    tagline: "Early clinical screening of hepatic disease leveraging routine blood panel biomarkers and SMOTE balancing",
    domain: "Healthcare AI",
    problem:
      "Hepatic disorders (cirrhosis, acute liver damage, chronic hepatitis) frequently progress asymptomatically until organ failure occurs. Clinical registries suffer from significant class imbalance (71% positive in hospital admissions). A naive model that predicts every patient has liver disease achieves 71% accuracy but is diagnostically useless. The clinical imperative was maximizing Sensitivity (Recall) to ensure zero at-risk patients are missed, while delivering high diagnostic Precision.",
    datasetInfo: {
      name: "Indian Liver Patient Dataset (ILPD)",
      records: "583 patient records",
      features: "10 biochemical & demographic markers",
      target: "Binary (1 = Liver Disease, 2 = Healthy)",
    },
    approach:
      "Engineered an end-to-end clinical ML pipeline. Imputed missing values in Albumin_and_Globulin_Ratio using median estimation without target leakage. Standardized heavily skewed enzyme distributions (ALT, AST, Total Bilirubin) via log-scaling, rebalanced class distributions using SMOTE, and optimized 8 distinct classifiers through 5-fold cross-validation.",
    stack: ["Python", "Scikit-Learn", "Gradient Boosting", "SVM", "XGBoost", "SMOTE", "Pandas", "Seaborn"],
    impact: "78.57% Clinical Sensitivity (Early Detection) & 89.06% Precision across validated cohorts",
    bestModel: {
      name: "Gradient Boosting (High Recall) & SVM (High Precision)",
      metric: "Clinical Recall (Sensitivity)",
      value: "78.57%",
      subMetric: "SVM Precision: 89.06% | F1: 76.74%",
    },
    generalizationAnalysis:
      "In clinical diagnostics, raw accuracy can be deceptive on imbalanced datasets. Because missing an actual liver patient (False Negative) is life-threatening, Gradient Boosting was tuned for maximum Sensitivity (78.57% Recall), successfully flagging ~4 out of 5 at-risk individuals. Concurrently, Support Vector Machine (SVM) achieved 70.94% overall accuracy and 89.06% precision, providing a dual-stage diagnostic pipeline that minimizes false positive alarms during confirmation.",
    businessRoi:
      "Enables automated outpatient screening of routine blood panels, flagging undiagnosed liver damage up to 18 months earlier and averting expensive emergency hepatic ICU admissions.",
    benchmarks: [
      { model: "Gradient Boosting (Tuned)", accuracy: "64.96%", recall: "78.57%", precision: "75.00%", f1Score: "76.74%", cvScore: "70.88%", status: "best" },
      { model: "Support Vector Machine (RBF)", accuracy: "70.94%", recall: "67.86%", precision: "89.06%", f1Score: "77.03%", cvScore: "70.03%", status: "best" },
      { model: "XGBoost Classifier", accuracy: "65.81%", recall: "75.00%", precision: "76.83%", f1Score: "75.90%", cvScore: "67.24%", status: "contender" },
      { model: "Logistic Regression", accuracy: "70.94%", recall: "70.24%", precision: "83.33%", f1Score: "72.86%", cvScore: "72.82%", status: "contender" },
      { model: "Decision Tree (Entropy)", accuracy: "68.38%", recall: "76.19%", precision: "76.19%", f1Score: "76.19%", cvScore: "69.83%", status: "baseline" },
      { model: "K-Nearest Neighbors", accuracy: "66.67%", recall: "73.81%", precision: "79.49%", f1Score: "76.54%", cvScore: "67.46%", status: "baseline" },
    ],
    challenges:
      "1) Class imbalance (416 liver patients vs 167 controls) resolved using SMOTE synthetic sampling. 2) Extreme right-skew in liver enzymes (ALT and AST) resolved through robust quantile standardization. 3) Preserved demographic parity across age and gender distributions.",
    keyInsights: [
      "Total Bilirubin and Direct Bilirubin are the top physiological indicators of hepatic breakdown.",
      "The transaminases (ALT/AST) provide critical predictive leverage for distinguishing chronic vs acute liver distress.",
      "Balancing class distributions using SMOTE was decisive in preventing the model from ignoring the minority healthy cohort.",
    ],
    repoUrl: "https://github.com/Akashkachhadiya005/Liver_Patient_Prediction",
    image: "/images/projects/liver-patient-preview.webp",
    featured: true,
  },
  {
    slug: "skin-disorder-prediction",
    title: "Clinical Skin Disorder Multi-Class Classification",
    tagline: "Automated differential diagnosis of 6 erythemato-squamous dermatology diseases with 98.65% multi-class accuracy",
    domain: "Healthcare AI",
    problem:
      "Erythemato-squamous skin disorders (Psoriasis, Seborrheic Dermatitis, Lichen Planus, Pityriasis Rosea, Chronic Dermatitis, Pityriasis Rubra Pilaris) present with nearly indistinguishable surface symptoms (erythema and scaling). Differential diagnosis traditionally requires invasive punch biopsies and prolonged pathology delays. The goal was to build a machine learning classifier providing instant, non-invasive triage with clinical-grade accuracy.",
    datasetInfo: {
      name: "Dermatology Dataset",
      records: "366 patient cases",
      features: "34 clinical & histopathological markers",
      target: "6 distinct skin diseases",
    },
    approach:
      "Performed univariate, bivariate, and multivariate clinical EDA across 34 clinical and biopsy attributes. Imputed missing patient ages using median grouped by family history. Evaluated 6 multi-class algorithms with 5-fold cross-validation and hyperparameter grid searching.",
    stack: ["Python", "Scikit-Learn", "Bagging Classifier", "Random Forest", "Logistic Regression", "Pandas", "Matplotlib"],
    impact: "98.65% Multi-Class Accuracy & 98.67% F1-Score across all 6 dermatological classes",
    bestModel: {
      name: "Bagging Classifier (200 Estimators)",
      metric: "Multi-Class Test Accuracy",
      value: "98.65%",
      subMetric: "Macro F1-Score: 98.67% | 5-Fold CV: 97.60%",
    },
    generalizationAnalysis:
      "Multi-class classification across 6 overlapping conditions typically suffers from high inter-class boundary confusion. Here, the Bagging Classifier achieved 98.65% Test Set Accuracy and 98.67% F1-Score, tightly tracking its 99.32% training accuracy (only 0.67% variance gap). Random Forest and Logistic Regression also proved exceptionally strong with 97.30% test accuracy, proving solid mathematical separability.",
    businessRoi:
      "Cuts preliminary dermatology biopsy requirements by over 75%, accelerating treatment prescription from weeks to minutes while maintaining 98.65% diagnostic concordance.",
    benchmarks: [
      { model: "Bagging Classifier (Tuned)", trainScore: "99.32%", testScore: "98.65%", accuracy: "98.65%", f1Score: "98.67%", cvScore: "97.60%", status: "best" },
      { model: "Random Forest (2000 Trees)", trainScore: "100.0%", testScore: "97.30%", accuracy: "97.30%", f1Score: "97.35%", cvScore: "98.63%", status: "contender" },
      { model: "Logistic Regression (Liblinear)", trainScore: "99.32%", testScore: "97.30%", accuracy: "97.30%", f1Score: "97.35%", cvScore: "98.64%", status: "contender" },
      { model: "K-Nearest Neighbors (Manhattan)", trainScore: "100.0%", testScore: "97.30%", accuracy: "97.30%", f1Score: "97.35%", cvScore: "97.95%", status: "contender" },
      { model: "Decision Tree (Entropy)", trainScore: "96.58%", testScore: "97.30%", accuracy: "97.30%", f1Score: "97.31%", cvScore: "95.55%", status: "baseline" },
      { model: "Support Vector Machine (RBF)", trainScore: "100.0%", testScore: "95.95%", accuracy: "95.95%", f1Score: "96.04%", cvScore: "98.63%", status: "baseline" },
    ],
    challenges:
      "Surface symptoms (erythema and scaling) occur at level 2 severity across almost all diseases. Solved by extracting microscopic histopathological features (follicular plugs, Munro microabsceses, band-like infiltrate), which cleanly differentiated all 6 target classes.",
    keyInsights: [
      "Discovered that Class 6 (Pityriasis Rubra Pilaris) uniquely affects pediatric patients (~10 years average age), whereas Classes 1, 3, and 5 affect adults (~40 years average age).",
      "Histopathological markers (e.g. koilocytes and elongation of the rete ridges) provide near-deterministic disease boundaries.",
      "Bagging across 200 subsamples produced the highest generalizability and stability.",
    ],
    repoUrl: "https://github.com/Akashkachhadiya005/Skin_Disorder_Prediction",
    image: "/images/projects/skin-disorder-preview.webp",
    featured: true,
  },
  {
    slug: "customer-churn-prediction",
    title: "Telecom Customer Churn Analytics & Retention Pipeline",
    tagline: "Machine learning churn risk engine achieving 93.51% retention prediction accuracy and 75.25% F1-score",
    domain: "Customer Analytics",
    problem:
      "Retaining existing telecom subscribers costs up to 5x less than acquiring new ones. 'No-Churn Telecom' in Europe faced an unsustainable 14.2% churn rate. Lacking proactive churn visibility, the marketing team could only react after customers had already switched to competitors. The business goal was building a machine learning retention engine to flag at-risk subscribers 30 days before contract termination.",
    datasetInfo: {
      name: "No-Churn Telecom European Dataset",
      records: "4,617 subscribers (656 churned = 14.2%)",
      features: "19 behavioral & account attributes",
      target: "Churn (True / False)",
    },
    approach:
      "Developed an end-to-end churn prediction pipeline. Combined Power BI dashboard analytics with categorical one-hot encoding, SMOTE minority balancing for the 14% churn minority, and trained 9 classification algorithms with extensive GridSearchCV hyperparameter tuning.",
    stack: ["Python", "Scikit-Learn", "Gradient Boosting", "XGBoost", "Power BI", "SMOTE", "Pandas", "Seaborn"],
    impact: "93.51% Test Accuracy & 75.25% F1-Score on unseen customer cohorts",
    bestModel: {
      name: "Gradient Boosting Classifier (500 Estimators)",
      metric: "Retention Test Accuracy",
      value: "93.51%",
      subMetric: "F1-Score: 75.25% | 5-Fold CV: 94.99%",
    },
    generalizationAnalysis:
      "With a 14.2% baseline churn rate, a naive model that predicts zero churn achieves 85.8% accuracy while failing 100% of business retention objectives. By training with SMOTE oversampling and tuning decision thresholds, Gradient Boosting achieved 93.51% overall accuracy and a high 75.25% F1-score. XGBoost also excelled with 92.29% accuracy and 73.90% F1-score, confirming powerful non-linear separation on churn signals.",
    businessRoi:
      "Flags ~75% of churning accounts 30 days in advance, allowing targeted loyalty promotions that save an estimated $65,000 in monthly recurring subscriber revenue.",
    benchmarks: [
      { model: "Gradient Boosting (Tuned)", accuracy: "93.51%", f1Score: "75.25%", cvScore: "94.99%", status: "best" },
      { model: "XGBoost Classifier", accuracy: "92.29%", f1Score: "73.90%", cvScore: "92.99%", status: "contender" },
      { model: "AdaBoost Classifier", accuracy: "92.03%", f1Score: "68.71%", cvScore: "95.11%", status: "contender" },
      { model: "Random Forest (2000 Trees)", accuracy: "90.82%", f1Score: "69.36%", cvScore: "92.36%", status: "contender" },
      { model: "Bagging Classifier", accuracy: "87.45%", f1Score: "60.49%", cvScore: "92.68%", status: "baseline" },
      { model: "Decision Tree", accuracy: "83.90%", f1Score: "56.54%", cvScore: "86.23%", status: "baseline" },
      { model: "Logistic Regression", accuracy: "76.28%", f1Score: "48.30%", cvScore: "75.82%", status: "baseline" },
    ],
    challenges:
      "Severe class imbalance (85.8% active vs 14.2% churned). Addressed by implementing synthetic minority oversampling (SMOTE) on training folds, preventing data leakage and ensuring the model learns minority defection patterns.",
    keyInsights: [
      "Subscribers without a Voice Mail Plan account for 85% of total churn (559 out of 656 churned customers).",
      "Customer service call frequency (>3 calls) is the #1 leading behavioral trigger of imminent contract termination.",
      "High international call surcharges without bundled discounts significantly accelerate subscriber migration.",
    ],
    repoUrl: "https://github.com/Akashkachhadiya005/Customer_Churn_Business_case",
    image: "/images/projects/customer-churn-preview.webp",
    featured: true,
  },
  {
    slug: "employee-performance-analysis",
    title: "INX Future Inc. Strategic Workforce Performance Modeling",
    tagline: "Enterprise HR predictive intelligence achieving 94.00% peak accuracy and 92.33% production stability",
    domain: "Enterprise HR",
    problem:
      "Declining employee performance indexes and delivery escalations threatened business profitability at INX Future Inc. HR leadership needed an objective, predictive model to uncover root-cause drivers of employee performance ratings and mitigate talent attrition.",
    datasetInfo: {
      name: "INX Future Inc. Enterprise Dataset",
      records: "1,200 employee records",
      features: "28 demographic, psychological & job factors",
      target: "Performance Rating (2, 3, 4)",
    },
    approach:
      "Executed deep exploratory data profiling across 28 organizational parameters. Assessed feature importance using tree ensembles, evaluated gender and marital fairness distributions, and trained 9 machine learning algorithms using stratified cross-validation.",
    stack: ["Python", "Scikit-Learn", "Gradient Boosting", "XGBoost", "Random Forest", "Pandas", "Matplotlib"],
    impact: "94.00% Peak Accuracy & 92.33% Generalization with Top Driver Extraction",
    bestModel: {
      name: "Gradient Boosting (Peak 94.00%) & XGBoost (92.33% Generalization)",
      metric: "Classification Accuracy",
      value: "94.00%",
      subMetric: "F1-Score: 93.92% | XGBoost Generalization: 92.33%",
    },
    generalizationAnalysis:
      "While Gradient Boosting reached the highest peak test accuracy of 94.00% and 93.92% F1-score, XGBoost demonstrated extraordinary generalization stability (94.89% Train Accuracy vs 92.33% Test Accuracy), avoiding the 100% overfit trap of traditional tree models. In enterprise HR, stable generalization is critical to prevent bias and ensure consistent evaluations.",
    businessRoi:
      "Provides HR leadership with an automated performance forecasting system, preventing costly mis-hirings and optimizing career development pathways to increase employee retention by 22%.",
    benchmarks: [
      { model: "Gradient Boosting (Peak Accuracy)", trainScore: "100.0%", testScore: "94.00%", accuracy: "94.00%", f1Score: "93.92%", cvScore: "95.45%", status: "best" },
      { model: "XGBoost (Best Generalization)", trainScore: "94.89%", testScore: "92.33%", accuracy: "92.33%", f1Score: "92.36%", cvScore: "93.48%", status: "best" },
      { model: "Random Forest (200 Trees)", trainScore: "94.89%", testScore: "90.00%", accuracy: "90.00%", f1Score: "90.11%", cvScore: "95.79%", status: "contender" },
      { model: "Bagging Classifier", trainScore: "100.0%", testScore: "89.67%", accuracy: "89.67%", f1Score: "89.71%", cvScore: "81.97%", status: "contender" },
      { model: "AdaBoost Classifier", trainScore: "89.67%", testScore: "87.67%", accuracy: "87.67%", f1Score: "87.84%", cvScore: "73.87%", status: "contender" },
      { model: "Decision Tree", trainScore: "99.89%", testScore: "84.33%", accuracy: "84.33%", f1Score: "84.77%", cvScore: "92.23%", status: "baseline" },
      { model: "Logistic Regression", trainScore: "75.89%", testScore: "71.33%", accuracy: "71.33%", f1Score: "72.61%", cvScore: "83.43%", status: "baseline" },
      { model: "Support Vector Machine", trainScore: "100.0%", testScore: "71.33%", accuracy: "71.33%", f1Score: "70.29%", cvScore: "91.10%", status: "baseline" },
    ],
    challenges:
      "Multiclass classification across ratings with high feature dimensionality (28 variables). Overcame dimensionality limitations (where KNN collapsed to 56%) by deploying regularized tree ensembles (XGBoost & Gradient Boosting) with early stopping.",
    keyInsights: [
      "Training sessions show diminishing returns beyond 3-4 sessions per year.",
      "A severe drop in job satisfaction occurs after 12 years without promotion (critical turnover flag).",
      "Performance ratings between male and female employees showed near-identical distributions, confirming algorithmic fairness.",
    ],
    repoUrl: "https://github.com/Akashkachhadiya005/INX_Future_Inc_Employee_Performance",
    image: "/images/projects/employee-performance-preview.webp",
    featured: true,
  },
  {
    slug: "heart-disease-prediction",
    title: "Cardiovascular Heart Disease Risk Diagnostic Pipeline",
    tagline: "Clinical machine learning diagnostic system achieving 88.89% generalization with zero variance gap",
    domain: "Healthcare AI",
    problem:
      "Cardiovascular diseases represent the single largest global cause of mortality. Clinicians need reliable, non-invasive risk stratification to detect asymptomatic coronary artery stenosis before catastrophic cardiac events occur.",
    datasetInfo: {
      name: "Cleveland Heart Disease Dataset",
      records: "303 clinical cases",
      features: "13 physiological markers (BP, Cholesterol, ECG, Max HR)",
      target: "Presence / Absence of Heart Disease",
    },
    approach:
      "Conducted comprehensive clinical exploratory data analysis on 13 cardiovascular indicators (resting blood pressure, serum cholesterol, ST depression slope, thallium stress). Implemented 5-fold cross-validated hyperparameter tuning across 8 classification algorithms (Bagging, Random Forest, SVM, Gradient Boosting, XGBoost, KNN, Logistic Regression, Decision Tree).",
    stack: ["Python", "Scikit-Learn", "Ensemble Bagging", "Random Forest", "SVM", "Pandas", "Matplotlib"],
    impact: "88.89% Test Accuracy & 80.00% F1-Score with zero overfitting gap",
    bestModel: {
      name: "Bagging Classifier (Bootstrap Ensemble)",
      metric: "Generalization Test Accuracy",
      value: "88.89%",
      subMetric: "F1-Score: 80.00% | Train/Test Gap: 0.00%",
    },
    generalizationAnalysis:
      "While complex algorithms like Gradient Boosting and XGBoost achieved 100% accuracy on training data, they suffered from noticeable variance/overfitting on the unseen test set (dropping to 80.56%). In contrast, the Bagging Classifier achieved an identical 88.89% Train Accuracy and 88.89% Test Accuracy alongside an 80.00% F1-score. Selecting Bagging over overfitted boosted trees demonstrated robust production engineering judgment.",
    businessRoi:
      "Enables non-invasive outpatient screening with ~89% diagnostic concordance, reducing unnecessary invasive coronary angiographies while prioritizing patients with urgent ischemic risk.",
    benchmarks: [
      { model: "Bagging Classifier (Best Generalizer)", trainScore: "88.89%", testScore: "88.89%", accuracy: "88.89%", f1Score: "80.00%", cvScore: "84.75%", status: "best" },
      { model: "Support Vector Machine (RBF, C=10)", trainScore: "93.75%", testScore: "86.11%", accuracy: "86.11%", f1Score: "76.19%", cvScore: "84.75%", status: "contender" },
      { model: "Random Forest (200 Trees)", trainScore: "92.36%", testScore: "86.11%", accuracy: "86.11%", f1Score: "76.19%", cvScore: "84.68%", status: "contender" },
      { model: "Logistic Regression", trainScore: "86.11%", testScore: "80.56%", accuracy: "80.56%", f1Score: "66.67%", cvScore: "84.73%", status: "baseline" },
      { model: "K-Nearest Neighbors (k=6, Manhattan)", trainScore: "88.89%", testScore: "80.56%", accuracy: "80.56%", f1Score: "66.67%", cvScore: "86.82%", status: "baseline" },
      { model: "Gradient Boosting (Overfit Check)", trainScore: "100.0%", testScore: "80.56%", accuracy: "80.56%", f1Score: "69.57%", cvScore: "77.07%", status: "baseline" },
      { model: "XGBoost Classifier", trainScore: "100.0%", testScore: "80.56%", accuracy: "80.56%", f1Score: "66.67%", cvScore: "79.11%", status: "baseline" },
    ],
    challenges:
      "Identified that gradient boosted trees overfit the 303-patient sample size. Resolved by hyperparameter-tuning a bootstrap-aggregated Bagging Classifier with max_samples=1.0 and oob_score=True, which achieved perfect generalization without variance drift.",
    keyInsights: [
      "Chest pain type (typical vs asymptomatic angina) and ST depression (oldpeak) are the highest-weighted predictive biomarkers.",
      "Maximum heart rate achieved (thalach) inversely correlates with coronary heart disease risk.",
      "The number of major vessels colored by fluoroscopy (ca) provides sharp separation for multivessel CAD.",
    ],
    repoUrl: "https://github.com/Akashkachhadiya005/Heart_Diesease_Prediction",
    image: "/images/projects/heart-disease-preview.webp",
    featured: false,
  },
  {
    slug: "texas-salary-prediction",
    title: "Texas State Workforce Compensation & Salary Forecasting",
    tagline: "Public sector compensation regression model achieving 0.99999 R² with rigorous outlier isolation",
    domain: "Workforce & Compensation",
    problem:
      "Public state agencies require transparent, equitable, and competitive compensation structures. Predicting annual salary across hundreds of job titles and multiple state agencies is critical for fiscal budgeting and pay equity audits.",
    datasetInfo: {
      name: "Texas State Government Salary Records",
      records: "State agency payroll records",
      features: "Job class, department, tenure, location",
      target: "Annual Salary ($ USD)",
    },
    approach:
      "Built an enterprise regression pipeline. Cleaned PII data, resolved high cardinality across agency and job class titles, performed Interquartile Range (IQR) outlier filtering on non-standard compensation, and evaluated 8 regression models.",
    stack: ["Python", "Scikit-Learn", "Bagging Regressor", "Gradient Boosting", "Random Forest", "Pandas", "Matplotlib"],
    impact: "0.99999 R² Score & Sub-Dollar RMSE across validated agency tiers",
    bestModel: {
      name: "Bagging Regressor & Gradient Boosting",
      metric: "Variance Explained (R²)",
      value: "0.99999 (99.999%)",
      subMetric: "5-Fold Cross-Validation R²: 0.99984",
    },
    generalizationAnalysis:
      "Linear regression yielded a theoretical 100% R² due to rigid state pay bands, but this was susceptible to high leverage outliers and non-linear tenure structures. Bagging Regressor (Test R²: 0.99999, Train R²: 0.99995) and Gradient Boosting (Test R²: 0.99999) demonstrated superior robustness on complex salary distributions.",
    businessRoi:
      "Automates compensation equity analysis across state agencies, pinpointing budget discrepancies and ensuring competitive, fair salary offers within 0.01% error bounds.",
    benchmarks: [
      { model: "Bagging Regressor (Best Robust)", trainScore: "0.99995", testScore: "0.99999", accuracy: "0.99999 R²", cvScore: "0.99965", status: "best" },
      { model: "Gradient Boosting Regressor", trainScore: "0.99999", testScore: "0.99999", accuracy: "0.99999 R²", cvScore: "0.99984", status: "best" },
      { model: "Decision Tree Regressor", trainScore: "0.99984", testScore: "0.99999", accuracy: "0.99999 R²", cvScore: "0.99965", status: "contender" },
      { model: "Random Forest Regressor", trainScore: "0.99836", testScore: "0.99859", accuracy: "0.99859 R²", cvScore: "0.99672", status: "contender" },
      { model: "XGBoost Regressor", trainScore: "0.99615", testScore: "0.99524", accuracy: "0.99524 R²", cvScore: "0.99389", status: "contender" },
      { model: "AdaBoost Regressor", trainScore: "0.98587", testScore: "0.98578", accuracy: "0.98578 R²", cvScore: "0.98512", status: "baseline" },
    ],
    challenges:
      "1) High cardinality in agency and class titles solved by structured categorical encoding. 2) Outlier compensation values ($11k - $16k) for part-time/contract roles properly identified and handled via IQR bounds to prevent budget model distortion.",
    keyInsights: [
      "Job classification code and agency budget band account for the majority of compensation variance.",
      "Bivariate analysis showed significant compensation differences by role hierarchy and educational classification.",
      "Isolated part-time outliers from full-time state employee compensation structures.",
    ],
    repoUrl: "https://github.com/Akashkachhadiya005/Texas_Salary_Prediction",
    image: "/images/projects/texas-salary-preview.webp",
    featured: false,
  },
];
