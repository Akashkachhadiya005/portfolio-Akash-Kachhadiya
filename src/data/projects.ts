import type { Project } from "@/types";

export const projects: Project[] = [
  {
    slug: "skin-disorder-prediction",
    title: "Skin Disorder Prediction",
    problem: "Classify skin disorders from medical data to assist clinical diagnosis.",
    approach:
      "Analyzed and preprocessed medical data. Implemented Random Forest, SVM, Bagging, XGBoost with hyperparameter tuning and feature selection.",
    stack: ["Python", "Scikit-learn", "XGBoost", "Jupyter", "Matplotlib"],
    impact: "98.65% classification accuracy",
    featured: true,
  },
  {
    slug: "customer-churn-prediction",
    title: "Customer Churn Prediction",
    problem:
      "Identify which customers are likely to churn to enable proactive retention.",
    approach:
      "Analyzed customer behavior patterns using statistical methods. Applied Logistic Regression and Random Forest with feature engineering.",
    stack: ["Python", "Scikit-learn", "Pandas", "Seaborn", "Jupyter"],
    impact: "91.33% prediction accuracy",
    featured: true,
  },
  {
    slug: "employee-performance-analysis",
    title: "Employee Performance Analysis",
    problem:
      "Predict and understand employee performance and key KPIs for HR decision-making.",
    approach:
      "Implemented Logistic Regression, Random Forest, XGBoost, Decision Tree, SVM, and Gradient Boosting classifiers.",
    stack: ["Python", "Scikit-learn", "XGBoost", "Pandas", "Matplotlib"],
    impact: "92.33% accuracy",
    featured: true,
  },
  {
    slug: "texas-salary-prediction",
    title: "Texas Salary Prediction",
    problem:
      "Predict salaries based on experience, education, and location for workforce planning.",
    approach:
      "Built Linear Regression, Decision Trees, Gradient Boosting, AdaBoost, and Bagging models with feature engineering.",
    stack: ["Python", "Scikit-learn", "Pandas", "Matplotlib", "Seaborn"],
    impact: "High accuracy (training result — model optimization focus)",
    featured: false,
  },
];
