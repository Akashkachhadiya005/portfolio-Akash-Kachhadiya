/** Tech logos — all URLs verified working (Devicon CDN via jsDelivr) */

const DEV = "https://cdn.jsdelivr.net/gh/devicons/devicon/icons";

export type TechLogo = {
  name: string;
  src: string;
};

export type OrbitRing = {
  label: string;
  radius: number;
  speed: number;
  tilt: number;
  techs: TechLogo[];
};

export const orbitRings: OrbitRing[] = [
  {
    label: "AI & Deep Learning",
    radius: 95,
    speed: 1,
    tilt: 12,
    techs: [
      { name: "PyTorch", src: `${DEV}/pytorch/pytorch-original.svg` },
      { name: "TensorFlow", src: `${DEV}/tensorflow/tensorflow-original.svg` },
      { name: "Keras", src: `${DEV}/keras/keras-original.svg` },
      { name: "OpenCV", src: `${DEV}/opencv/opencv-original.svg` },
    ],
  },
  {
    label: "Cloud & Infrastructure",
    radius: 150,
    speed: -0.72,
    tilt: -28,
    techs: [
      { name: "AWS", src: `${DEV}/amazonwebservices/amazonwebservices-original-wordmark.svg` },
      { name: "Docker", src: `${DEV}/docker/docker-original.svg` },
      { name: "Kubernetes", src: `${DEV}/kubernetes/kubernetes-original.svg` },
      { name: "PostgreSQL", src: `${DEV}/postgresql/postgresql-original.svg` },
      { name: "MongoDB", src: `${DEV}/mongodb/mongodb-original.svg` },
      { name: "Grafana", src: `${DEV}/grafana/grafana-original.svg` },
    ],
  },
  {
    label: "Data & Tools",
    radius: 205,
    speed: 0.52,
    tilt: 42,
    techs: [
      { name: "Python", src: `${DEV}/python/python-original.svg` },
      { name: "Pandas", src: `${DEV}/pandas/pandas-original.svg` },
      { name: "NumPy", src: `${DEV}/numpy/numpy-original.svg` },
      { name: "Scikit-learn", src: `${DEV}/scikitlearn/scikitlearn-original.svg` },
      { name: "Apache Spark", src: `${DEV}/apachespark/apachespark-original.svg` },
      { name: "FastAPI", src: `${DEV}/fastapi/fastapi-original.svg` },
      { name: "Jupyter", src: `${DEV}/jupyter/jupyter-original-wordmark.svg` },
      { name: "Git", src: `${DEV}/git/git-original.svg` },
    ],
  },
];
