# Análisis de Caza Ilegal

Este repositorio contiene un análisis multivariado de casos de caza ilegal utilizando técnicas de Análisis de Correspondencias Múltiples (MCA) y clustering jerárquico.

## 📊 Dashboard Interactivo

Visita el dashboard interactivo en GitHub Pages para explorar los análisis y visualizaciones:

**[Ver Dashboard](https://tu-usuario.github.io/caza_bases/)**

*(Reemplaza `tu-usuario` con tu nombre de usuario de GitHub)*

## 🎯 Objetivos

- Identificar patrones y perfiles de infractores en casos de caza ilegal
- Analizar las relaciones entre variables socioeconómicas, demográficas y de operación
- Clasificar los casos en clusters según sus características
- Proporcionar visualizaciones interactivas para explorar los datos

## 📁 Estructura del Proyecto

```
caza_bases/
├── docs/                      # Sitio web de GitHub Pages
│   ├── index.html            # Página principal del dashboard
│   ├── css/
│   │   └── styles.css        # Estilos personalizados
│   ├── js/
│   │   └── main.js           # Lógica y visualizaciones
│   └── data/
│       └── mca_classes.csv   # Datos procesados
├── caza2/                     # Análisis originales en R
│   ├── code.R                # Código de análisis en R
│   ├── data/
│   │   └── processed/
│   │       └── mca_classes.csv
│   └── imagenes/             # Gráficos generados
└── README.md
```

## 🔍 Análisis Realizados

### 1. Análisis de Correspondencias Múltiples (MCA)
Técnica de análisis multivariado que permite visualizar las relaciones entre múltiples variables categóricas en un espacio bidimensional.

### 2. Clustering Jerárquico
Identificación de grupos de casos similares basados en sus características.

### 3. Patrones Identificados

El análisis reveló tres patrones principales:

- **Caza Estratégica**: Caracterizada por el uso de vehículos pesados (camiones/máquinas), orientada a la extracción de maderas y recursos de alto valor.

- **Caza Táctica**: Focalizada en la pesca ilegal y caza de fauna menor, generalmente con grupos pequeños y equipo especializado.

- **Caza Combinada**: Presenta características mixtas con variedad en tipos de decomisos y métodos utilizados.

## 📈 Variables Analizadas

- **Operacionales**: Tipo de movilidad, decomisos, secuestros, número de miembros
- **Demográficas**: Género, edad
- **Socioeconómicas**: Ocupación, nivel socioeconómico, acceso a servicios bancarios
- **Financieras**: Monto en bancos, calificación BCRA, compromisos mensuales

## 🛠️ Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript
- **Visualizaciones**: Plotly.js
- **Procesamiento de datos**: D3.js
- **Diseño**: CSS Grid, Flexbox
- **Análisis estadístico**: R (análisis original)

## 🎨 Características del Dashboard

- Diseño responsivo adaptado a dispositivos móviles
- Tema oscuro profesional con paleta de colores personalizada
- Gráficos interactivos con Plotly.js
- Estadísticas generales y por cluster
- Análisis demográfico y socioeconómico
- Visualización del mapa factorial (MCA)

## 📝 Cómo Usar

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/tu-usuario/caza_bases.git
   ```

2. **Abrir localmente**:
   Abre el archivo `docs/index.html` en tu navegador web.

3. **Desplegar en GitHub Pages**:
   - Ve a Settings > Pages
   - Selecciona la carpeta `/docs` como fuente
   - Guarda los cambios

## 📊 Datos

Los datos incluyen información sobre:
- Casos de caza ilegal
- Características de los infractores
- Tipos de decomisos y secuestros
- Perfiles socioeconómicos

**Nota**: Los datos han sido procesados y anonimizados para proteger la privacidad.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue para discutir cambios mayores antes de crear un pull request.

## 📄 Licencia

Este proyecto está disponible bajo la licencia especificada en el archivo CITATION.cff.

## 📧 Contacto

Para preguntas o comentarios sobre este análisis, por favor abre un issue en este repositorio.

---

**Desarrollado con fines de investigación y análisis de patrones de caza ilegal**
