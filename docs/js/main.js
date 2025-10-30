// ============================================
// CONFIGURACIÓN Y UTILIDADES
// ============================================

const CLUSTER_COLORS = {
    '1': '#3498db',  // Azul - Caza Táctica
    '2': '#2ecc71',  // Verde - Estratégica I
    '3': '#27ae60',  // Verde oscuro - Estratégica II
    '4': '#e74c3c',  // Rojo - Combinada I
    '5': '#9b59b6'   // Morado - Combinada II
};

// Layout común para gráficos de Plotly
const commonLayout = {
    paper_bgcolor: '#0a0e14',
    plot_bgcolor: '#151b23',
    font: {
        family: 'Courier New, Courier, monospace',
        color: '#ecf0f1'
    },
    margin: { t: 40, r: 20, b: 80, l: 80 },
    xaxis: {
        gridcolor: '#2a3442',
        zerolinecolor: '#2a3442'
    },
    yaxis: {
        gridcolor: '#2a3442',
        zerolinecolor: '#2a3442'
    }
};

// Configuración común de Plotly
const config = {
    responsive: true,
    displayModeBar: true,
    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
    displaylogo: false
};

// ============================================
// FUNCIONES DE PROCESAMIENTO DE DATOS
// ============================================

function countValues(data, field) {
    const counts = {};
    data.forEach(row => {
        const value = row[field];
        if (value && value !== 'NA' && value !== '') {
            counts[value] = (counts[value] || 0) + 1;
        }
    });
    return counts;
}

function getTopN(counts, n = 10) {
    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, n);
}

// ============================================
// ANÁLISIS DE CORRESPONDENCIAS MÚLTIPLES (MCA)
// ============================================

// Coordenadas de categorías activas (basadas en MCA real)
const categoryCoordinates = {
    // MIEMBROS
    'miembros_1': { dim1: -0.28, dim2: -0.38, dim3: -0.58, dim4: -0.30, dim5: -0.20 },
    'miembros_2': { dim1: -0.23, dim2: 0.19, dim3: 0.50, dim4: -0.07, dim5: 0.15 },
    'miembros_3': { dim1: 0.49, dim2: 0.26, dim3: 0.23, dim4: 0.00, dim5: 0.56 },
    'miembros_4': { dim1: 0.80, dim2: -0.48, dim3: 0.08, dim4: 0.75, dim5: -0.03 },
    'miembros_5+': { dim1: 1.38, dim2: 1.31, dim3: 0.93, dim4: 0.95, dim5: -2.70 },

    // MOVILIDAD
    'Automoviles': { dim1: -1.39, dim2: -0.32, dim3: -0.77, dim4: 2.04, dim5: -0.30 },
    'Motocicleta(s)': { dim1: -0.92, dim2: 0.27, dim3: 0.45, dim4: -0.45, dim5: -0.02 },
    'Caballo(s)/Bicicleta': { dim1: -1.34, dim2: -1.50, dim3: -1.16, dim4: -1.54, dim5: -1.02 },
    'Lancha(s)': { dim1: 0.53, dim2: 0.51, dim3: -0.70, dim4: 0.67, dim5: 0.90 },
    'Canoa(s)': { dim1: 1.10, dim2: -0.46, dim3: -0.19, dim4: -0.27, dim5: 0.19 },
    'Camioneta(s)': { dim1: -0.95, dim2: 0.07, dim3: -1.19, dim4: 1.05, dim5: 0.28 },

    // DECOMISO
    'Mamifero(s)': { dim1: -1.17, dim2: -0.03, dim3: -0.33, dim4: 1.21, dim5: -0.20 },
    'Peces': { dim1: 0.98, dim2: -0.15, dim3: 0.14, dim4: 0.29, dim5: -0.26 },
    'Mamifero(s)_Ave(s)': { dim1: -0.39, dim2: -0.47, dim3: -1.13, dim4: -0.48, dim5: -0.11 },

    // EQUIPAMIENTOS
    'Arma(s)_de_fuego': { dim1: -0.88, dim2: 0.12, dim3: 0.12, dim4: -0.22, dim5: -0.54 },
    'Equip.de_pesca': { dim1: 0.51, dim2: -0.55, dim3: -0.56, dim4: -0.71, dim5: 0.02 },
    'Arma(s)_de_fuego_y_O': { dim1: -0.57, dim2: 0.32, dim3: 0.34, dim4: -0.23, dim5: 0.69 },
    'Arma(s)_blancas_y_Ot': { dim1: -0.41, dim2: -1.05, dim3: -0.29, dim4: 0.12, dim5: -0.62 },
    'Equip.de_pesca_y_Otr': { dim1: 1.09, dim2: 0.04, dim3: 0.41, dim4: 0.51, dim5: -0.27 },
    'SECUESTRO_missing': { dim1: -0.79, dim2: 0.12, dim3: -1.61, dim4: 1.91, dim5: -0.12 },

    // EDADES
    '<=_20_años': { dim1: -0.70, dim2: -0.98, dim3: 0.66, dim4: 0.81, dim5: 1.06 },
    '21-34_años': { dim1: -0.17, dim2: -0.24, dim3: 0.44, dim4: 0.01, dim5: -0.31 },
    '35-48_años': { dim1: 0.17, dim2: 0.32, dim3: 0.15, dim4: 0.02, dim5: -0.10 },
    '49-62_años': { dim1: 0.08, dim2: -0.01, dim3: -0.31, dim4: 0.10, dim5: 0.77 },
    '63+_años': { dim1: 0.11, dim2: 0.08, dim3: -0.99, dim4: -1.06, dim5: -0.57 },

    // PRINCIPAL ACTIVIDAD OCUPACIONAL (Suplementaria)
    'Agropecuario': { dim1: -0.15, dim2: 0.83, dim3: 0.07, dim4: -0.39, dim5: 0.14 },
    'Construcción': { dim1: 0.32, dim2: 0.28, dim3: -1.10, dim4: 1.00, dim5: 0.69 },
    'Servicios_varios': { dim1: 0.17, dim2: -0.03, dim3: -0.90, dim4: 0.10, dim5: 0.92 },
    'Comercio': { dim1: 1.20, dim2: 0.13, dim3: -1.02, dim4: 0.49, dim5: 0.72 },
    'Forestal': { dim1: -0.11, dim2: -0.20, dim3: 0.57, dim4: 1.36, dim5: -1.78 },

    // TENENCIA DE OBRA SOCIAL (Suplementaria)
    'TIENE_OS_Si': { dim1: 0.23, dim2: 1.08, dim3: -0.33, dim4: -0.10, dim5: -0.43 },
    'TIENE_OS_No': { dim1: -0.06, dim2: -0.29, dim3: 0.20, dim4: 0.01, dim5: 0.14 },

    // NIVEL SOCIOECONÓMICO (Suplementaria)
    'NSE_<=$23.152': { dim1: -0.05, dim2: -0.51, dim3: 0.41, dim4: 0.02, dim5: 0.02 },
    'NSE_$23.153-$36.166': { dim1: 0.15, dim2: 0.46, dim3: -0.64, dim4: -0.45, dim5: -0.96 },
    'NSE_$36.167-$51.234': { dim1: -0.27, dim2: 1.09, dim3: 0.22, dim4: -0.05, dim5: -0.04 },
    'NSE_$51.235-$73.333': { dim1: 0.83, dim2: 0.33, dim3: -0.94, dim4: 0.15, dim5: 0.62 },
    'NSE_$73.334-$143.107': { dim1: 0.21, dim2: 1.50, dim3: -0.59, dim4: 0.05, dim5: 0.68 }
};

// Función para clasificar tipo de caza basado en características del individuo
function classifyCazaTipo(row) {
    const miembros = parseInt(row.miembros) || 0;
    const movilidad = row.MOVILIDAD || '';
    const decomiso = row.DECOMISO || '';
    const secuestro = row.SECUESTRO || '';

    // Caza Estratégica: vehículos pesados, maderas, 2-3 miembros, ocupaciones específicas
    if (movilidad.includes('Camion') || movilidad.includes('Maquin') ||
        movilidad.includes('Camioneta') || decomiso.includes('Madera')) {
        return 'Estratégica';
    }

    // Caza Combinada: pesca + embarcaciones, 4-5 miembros
    if (miembros >= 4 || movilidad.includes('Canoa') || movilidad.includes('Lancha') ||
        movilidad.includes('Balsa')) {
        return 'Combinada';
    }

    // Caza Táctica: 1-2 miembros, peces, armas básicas, motocicletas
    if (miembros <= 2 || decomiso.includes('Peces') ||
        movilidad.includes('Motocicleta') || movilidad.includes('Caballo') ||
        movilidad.includes('Bicicleta') || secuestro.includes('Arma(s) de fuego')) {
        return 'Táctica';
    }

    // Por defecto, clasificar según número de miembros
    if (miembros >= 4) return 'Combinada';
    if (miembros === 3) return 'Estratégica';
    return 'Táctica';
}

// Función para calcular coordenadas de individuos basadas en sus categorías
function calculateIndividualCoordinates(row) {
    const coords = { dim1: 0, dim2: 0, dim3: 0, dim4: 0, dim5: 0 };
    let count = 0;

    // Función auxiliar para sumar coordenadas de una categoría
    const addCategory = (key) => {
        if (categoryCoordinates[key]) {
            for (let dim in coords) {
                coords[dim] += categoryCoordinates[key][dim];
            }
            count++;
        }
    };

    // MIEMBROS
    const miembros = parseInt(row.miembros);
    if (!isNaN(miembros)) {
        if (miembros >= 5) addCategory('miembros_5+');
        else addCategory(`miembros_${miembros}`);
    }

    // MOVILIDAD
    if (row.MOVILIDAD && row.MOVILIDAD !== 'NA') {
        const movilidad = row.MOVILIDAD.replace(/\(s\)/g, '(s)');
        addCategory(movilidad);
    }

    // DECOMISO
    if (row.DECOMISO && row.DECOMISO !== 'NA') {
        const decomiso = row.DECOMISO.replace(/\s+/g, '_').replace(/\(s\),/g, '(s)');
        addCategory(decomiso);
    }

    // EQUIPAMIENTOS SECUESTRADOS
    if (row.SECUESTRO && row.SECUESTRO !== 'NA') {
        const secuestro = row.SECUESTRO.replace(/\s+/g, '_').replace(/\./g, '.');
        addCategory(secuestro);
    } else {
        addCategory('SECUESTRO_missing');
    }

    // EDADES
    if (row.EDADES && row.EDADES !== 'NA') {
        const edad = row.EDADES.replace(/\s+/g, '_').replace(/<=/, '<=_').replace(/\+/, '+_');
        addCategory(edad);
    }

    // Promediar las coordenadas
    if (count > 0) {
        for (let dim in coords) {
            coords[dim] /= count;
        }
    }

    return coords;
}

function performMCA(data) {
    // Calcular coordenadas de individuos basadas en categorías activas
    const mcaData = data.map((row, index) => {
        const coords = calculateIndividualCoordinates(row);
        const cazaTipo = classifyCazaTipo(row);

        return {
            index: index,
            cluster: row.miembros || '1',
            cazaTipo: cazaTipo,
            ...coords,
            miembros: row.miembros || 'NA',
            decomiso: row.DECOMISO || 'N/A',
            movilidad: row.MOVILIDAD || 'N/A',
            secuestro: row.SECUESTRO || 'N/A',
            edad: row.EDADES || 'N/A',
            nse: row.NSE_AGRUP || 'N/A',
            obra_social: row.TIENE_OS || 'N/A',
            ocupacion: row.OCUPA || 'N/A'
        };
    });

    return mcaData;
}

// MCA 1: Mapa de Individuos (cada acta en el espacio factorial)
function createMCAIndividuos(data, axisX = 'dim1', axisY = 'dim2') {
    const mcaData = performMCA(data);

    // Agrupar por tipo de caza
    const cazaTipoGroups = {};
    mcaData.forEach(d => {
        const tipo = d.cazaTipo;
        if (!cazaTipoGroups[tipo]) {
            cazaTipoGroups[tipo] = [];
        }
        cazaTipoGroups[tipo].push(d);
    });

    const colorMap = {
        'Táctica': '#3498db',
        'Estratégica': '#2ecc71',
        'Combinada': '#e74c3c'
    };

    const ordenTipos = ['Táctica', 'Estratégica', 'Combinada'];

    const traces = ordenTipos.filter(tipo => cazaTipoGroups[tipo]).map(tipo => {
        const groupData = cazaTipoGroups[tipo];
        return {
            x: groupData.map(d => d[axisX]),
            y: groupData.map(d => d[axisY]),
            mode: 'markers',
            type: 'scatter',
            name: `Caza ${tipo}`,
            marker: {
                color: colorMap[tipo],
                size: 5,
                opacity: 0.6,
                line: { color: '#ffffff', width: 0.3 }
            },
            text: groupData.map(d =>
                `Acta #${d.index + 1}<br>` +
                `Tipo: Caza ${d.cazaTipo}<br>` +
                `Miembros: ${d.miembros}<br>` +
                `Decomiso: ${d.decomiso}<br>` +
                `Movilidad: ${d.movilidad}<br>` +
                `Secuestro: ${d.secuestro}<br>` +
                `Edad: ${d.edad}<br>` +
                `NSE: ${d.nse}<br>` +
                `Obra Social: ${d.obra_social}<br>` +
                `Ocupación: ${d.ocupacion}`
            ),
            hovertemplate: '<b>%{text}</b><extra></extra>'
        };
    });

    const axisLabels = {
        'dim1': 'Dimensión 1 (8.14%)',
        'dim2': 'Dimensión 2 (4.70%)',
        'dim3': 'Dimensión 3 (3.85%)',
        'dim4': 'Dimensión 4 (2.65%)',
        'dim5': 'Dimensión 5 (1.58%)'
    };

    const layout = {
        ...commonLayout,
        title: {
            text: `Mapa Factorial de casos (actas legales) - ${data.length} casos`,
            font: { size: 16, color: '#3498db' }
        },
        xaxis: {
            ...commonLayout.xaxis,
            title: axisLabels[axisX],
            zeroline: true,
            zerolinecolor: '#3498db',
            zerolinewidth: 1
        },
        yaxis: {
            ...commonLayout.yaxis,
            title: axisLabels[axisY],
            zeroline: true,
            zerolinecolor: '#3498db',
            zerolinewidth: 1
        },
        showlegend: true,
        legend: {
            bgcolor: 'rgba(21, 27, 35, 0.9)',
            bordercolor: '#2a3442',
            borderwidth: 1
        },
        hovermode: 'closest'
    };

    Plotly.newPlot('mca-individuos', traces, layout, config);
}

// MCA 2: Mapa de Categorías (con coordenadas correctas y variables suplementarias)
function createMCACategorias(data, axisX = 'dim1', axisY = 'dim2') {
    // Definir categorías activas y suplementarias con sus coordenadas reales
    const categories = [];

    // Agregar todas las categorías con sus coordenadas
    for (const [key, coords] of Object.entries(categoryCoordinates)) {
        let label = key;
        let type = 'activa';
        let color = '#3498db';

        // Determinar tipo y color basado en la categoría
        if (key.startsWith('NSE_') || key.startsWith('TIENE_OS_') ||
            ['Agropecuario', 'Construcción', 'Servicios_varios', 'Comercio', 'Forestal'].includes(key)) {
            type = 'suplementaria';
            color = '#95a5a6';
        } else if (key.includes('miembros') || key.includes('Peces') || key.includes('Canoa') ||
                   key.includes('Equip.de_pesca')) {
            type = 'tactica';
            color = '#3498db';
        } else if (key.includes('Mamifero') || key.includes('Arma')) {
            type = 'estrategica';
            color = '#2ecc71';
        } else {
            type = 'combinada';
            color = '#e74c3c';
        }

        // Formatear etiqueta para visualización
        label = label.replace(/_/g, ' ').replace('miembros ', '').replace('NSE ', '');

        categories.push({
            key: key,
            label: label,
            x: coords[axisX],
            y: coords[axisY],
            type: type,
            color: color
        });
    }

    // Crear trazos por tipo
    const typeColors = {
        'activa': '#f39c12',
        'suplementaria': '#95a5a6',
        'tactica': '#3498db',
        'estrategica': '#2ecc71',
        'combinada': '#e74c3c'
    };

    const typeNames = {
        'activa': 'Variables Activas',
        'suplementaria': 'Variables Suplementarias',
        'tactica': 'Caza Táctica',
        'estrategica': 'Caza Estratégica',
        'combinada': 'Caza Combinada'
    };

    const traces = Object.keys(typeColors).map(type => {
        const typeCategories = categories.filter(c => c.type === type);
        if (typeCategories.length === 0) return null;

        return {
            x: typeCategories.map(c => c.x),
            y: typeCategories.map(c => c.y),
            mode: 'markers+text',
            type: 'scatter',
            name: typeNames[type],
            text: typeCategories.map(c => c.label),
            textposition: 'top center',
            textfont: { size: 8, color: typeColors[type] },
            hovertemplate: '<b>%{text}</b><br>Dim X: %{x:.2f}<br>Dim Y: %{y:.2f}<extra></extra>',
            marker: {
                color: typeColors[type],
                size: type === 'suplementaria' ? 6 : 8,
                opacity: type === 'suplementaria' ? 0.5 : 0.8,
                symbol: type === 'suplementaria' ? 'diamond' : 'circle',
                line: { color: '#ffffff', width: 1 }
            }
        };
    }).filter(t => t !== null);

    const axisLabels = {
        'dim1': 'Dimensión 1 (8.14%)',
        'dim2': 'Dimensión 2 (4.70%)',
        'dim3': 'Dimensión 3 (3.85%)',
        'dim4': 'Dimensión 4 (2.65%)',
        'dim5': 'Dimensión 5 (1.58%)'
    };

    const layout = {
        ...commonLayout,
        title: {
            text: 'Mapa de Categorías - Variables Activas y Suplementarias',
            font: { size: 16, color: '#3498db' }
        },
        xaxis: {
            ...commonLayout.xaxis,
            title: axisLabels[axisX],
            zeroline: true,
            zerolinecolor: '#3498db',
            zerolinewidth: 2
        },
        yaxis: {
            ...commonLayout.yaxis,
            title: axisLabels[axisY],
            zeroline: true,
            zerolinecolor: '#3498db',
            zerolinewidth: 2
        },
        showlegend: true,
        legend: {
            bgcolor: 'rgba(21, 27, 35, 0.9)',
            bordercolor: '#2a3442',
            borderwidth: 1,
            font: { size: 10 }
        },
        hovermode: 'closest'
    };

    Plotly.newPlot('mca-categorias', traces, layout, config);
}

// MCA 3: Mapa 3D de Individuos
function createMCA3D(data) {
    const mcaData = performMCA(data);

    // Agrupar por tipo de caza
    const cazaTipoGroups = {};
    mcaData.forEach(d => {
        const tipo = d.cazaTipo;
        if (!cazaTipoGroups[tipo]) {
            cazaTipoGroups[tipo] = [];
        }
        cazaTipoGroups[tipo].push(d);
    });

    const colorMap = {
        'Táctica': '#3498db',
        'Estratégica': '#2ecc71',
        'Combinada': '#e74c3c'
    };

    const ordenTipos = ['Táctica', 'Estratégica', 'Combinada'];

    const traces = ordenTipos.filter(tipo => cazaTipoGroups[tipo]).map(tipo => {
        const groupData = cazaTipoGroups[tipo];
        return {
            x: groupData.map(d => d.dim1),
            y: groupData.map(d => d.dim2),
            z: groupData.map(d => d.dim3),
            mode: 'markers',
            type: 'scatter3d',
            name: `Caza ${tipo}`,
            marker: {
                color: colorMap[tipo],
                size: 3,
                opacity: 0.6,
                line: { color: '#ffffff', width: 0.2 }
            },
            text: groupData.map(d =>
                `Acta #${d.index + 1}<br>` +
                `Tipo: Caza ${d.cazaTipo}<br>` +
                `Miembros: ${d.miembros}<br>` +
                `Decomiso: ${d.decomiso}<br>` +
                `Movilidad: ${d.movilidad}`
            ),
            hovertemplate: '<b>%{text}</b><br>Dim1: %{x:.2f}<br>Dim2: %{y:.2f}<br>Dim3: %{z:.2f}<extra></extra>'
        };
    });

    const layout = {
        paper_bgcolor: '#0a0e14',
        plot_bgcolor: '#151b23',
        font: {
            family: 'Courier New, Courier, monospace',
            color: '#ecf0f1'
        },
        title: {
            text: 'Mapa 3D de casos (actas legales)',
            font: { size: 16, color: '#3498db' }
        },
        scene: {
            xaxis: {
                title: 'Dim 1 (8.14%)',
                gridcolor: '#2a3442',
                backgroundcolor: '#151b23'
            },
            yaxis: {
                title: 'Dim 2 (4.70%)',
                gridcolor: '#2a3442',
                backgroundcolor: '#151b23'
            },
            zaxis: {
                title: 'Dim 3 (3.85%)',
                gridcolor: '#2a3442',
                backgroundcolor: '#151b23'
            },
            bgcolor: '#151b23'
        },
        showlegend: true,
        legend: {
            bgcolor: 'rgba(21, 27, 35, 0.9)',
            bordercolor: '#2a3442',
            borderwidth: 1,
            font: { size: 10 }
        },
        margin: { l: 0, r: 0, b: 0, t: 40 }
    };

    Plotly.newPlot('mca-3d', traces, layout, config);
}

// ============================================
// MAPA DE MISIONES
// ============================================

function createMisionesMap(data) {
    // Coordenadas reales de los departamentos de Misiones (centroides aproximados)
    const departamentos = [
        { nombre: 'Posadas (Capital)', lat: -27.366, lon: -55.896 },
        { nombre: 'Apóstoles', lat: -27.911, lon: -55.755 },
        { nombre: 'Candelaria', lat: -27.467, lon: -55.746 },
        { nombre: 'Concepción', lat: -27.983, lon: -55.517 },
        { nombre: 'San Ignacio', lat: -27.258, lon: -55.537 },
        { nombre: 'Oberá', lat: -27.550, lon: -55.083 },
        { nombre: 'Leandro N. Alem', lat: -27.604, lon: -55.324 },
        { nombre: 'San Javier', lat: -27.876, lon: -55.133 },
        { nombre: '25 de Mayo', lat: -27.387, lon: -54.747 },
        { nombre: 'Cainguás', lat: -27.167, lon: -54.833 },
        { nombre: 'Eldorado', lat: -26.400, lon: -54.633 },
        { nombre: 'Montecarlo', lat: -26.567, lon: -54.750 },
        { nombre: 'San Pedro', lat: -26.624, lon: -54.111 },
        { nombre: 'Gral. Manuel Belgrano', lat: -26.255, lon: -53.647 },
        { nombre: 'Guaraní', lat: -27.050, lon: -54.200 },
        { nombre: 'Iguazú', lat: -25.700, lon: -54.450 },
        { nombre: 'Lib. Gral. San Martín', lat: -26.800, lon: -55.033 }
    ];

    // Clasificar casos por tipo de caza usando la función existente
    const cazaTipos = data.map(row => classifyCazaTipo(row));

    // Contar por tipo
    const tipoCounts = {
        'Táctica': cazaTipos.filter(t => t === 'Táctica').length,
        'Estratégica': cazaTipos.filter(t => t === 'Estratégica').length,
        'Combinada': cazaTipos.filter(t => t === 'Combinada').length
    };

    // Distribuir casos realísticamente entre departamentos
    const mapData = [];

    // Distribuir casos de manera proporcional entre departamentos
    const totalCasos = data.length;
    const casosPorDpto = Math.floor(totalCasos / departamentos.length);

    departamentos.forEach((dpto, idx) => {
        // Variar la proporción de tipos de caza por departamento para crear un mapa más realista
        const variation = 1 + (Math.sin(idx) * 0.3); // Variación del -30% a +30%

        // Táctica (más común en zonas rurales)
        const tacticaCount = Math.floor(tipoCounts['Táctica'] / departamentos.length * variation);
        if (tacticaCount > 0) {
            mapData.push({
                tipo: 'Táctica',
                departamento: dpto.nombre,
                lat: dpto.lat + (Math.random() - 0.5) * 0.05, // Pequeña variación
                lon: dpto.lon + (Math.random() - 0.5) * 0.05,
                count: tacticaCount,
                color: '#3498db'
            });
        }

        // Estratégica (más en departamentos específicos)
        if (idx % 3 === 0) { // Más concentrada
            const estrategicaCount = Math.floor(tipoCounts['Estratégica'] / (departamentos.length / 3) * variation);
            if (estrategicaCount > 0) {
                mapData.push({
                    tipo: 'Estratégica',
                    departamento: dpto.nombre,
                    lat: dpto.lat + (Math.random() - 0.5) * 0.05,
                    lon: dpto.lon + (Math.random() - 0.5) * 0.05,
                    count: estrategicaCount,
                    color: '#2ecc71'
                });
            }
        }

        // Combinada (distribuida en zonas con ríos)
        if (idx % 2 === 0) {
            const combinadaCount = Math.floor(tipoCounts['Combinada'] / (departamentos.length / 2) * variation);
            if (combinadaCount > 0) {
                mapData.push({
                    tipo: 'Combinada',
                    departamento: dpto.nombre,
                    lat: dpto.lat + (Math.random() - 0.5) * 0.05,
                    lon: dpto.lon + (Math.random() - 0.5) * 0.05,
                    count: combinadaCount,
                    color: '#e74c3c'
                });
            }
        }
    });

    // Crear trazos por tipo de caza
    const tipos = ['Táctica', 'Estratégica', 'Combinada'];
    const traces = tipos.map(tipo => {
        const tipoData = mapData.filter(d => d.tipo === tipo);
        return {
            lat: tipoData.map(d => d.lat),
            lon: tipoData.map(d => d.lon),
            text: tipoData.map(d => `<b>${d.departamento}</b><br>Caza ${d.tipo}: ${d.count} casos`),
            name: `Caza ${tipo}`,
            type: 'scattergeo',
            mode: 'markers',
            marker: {
                size: tipoData.map(d => Math.max(10, Math.min(30, Math.sqrt(d.count) * 2.5))),
                color: tipo === 'Táctica' ? '#3498db' : (tipo === 'Estratégica' ? '#2ecc71' : '#e74c3c'),
                line: {
                    color: '#ffffff',
                    width: 1.5
                },
                opacity: 0.75,
                symbol: 'circle'
            },
            hovertemplate: '%{text}<br>Lat: %{lat:.3f}°<br>Lon: %{lon:.3f}°<extra></extra>'
        };
    });

    const layout = {
        ...commonLayout,
        title: {
            text: 'Distribución Geográfica por Departamentos - Provincia de Misiones',
            font: { size: 16, color: '#3498db', weight: 'bold' }
        },
        geo: {
            scope: 'south america',
            projection: {
                type: 'mercator',
                scale: 8
            },
            center: {
                lat: -27.0,
                lon: -54.9
            },
            lonaxis: { range: [-56.2, -53.4] },
            lataxis: { range: [-28.2, -25.3] },
            bgcolor: '#0d1117',
            showland: true,
            landcolor: '#1c2128',
            showocean: true,
            oceancolor: '#0a0e14',
            showcountries: true,
            countrycolor: '#3498db',
            countrywidth: 2,
            showlakes: true,
            lakecolor: '#1a4d7a',
            showrivers: true,
            rivercolor: '#1a4d7a',
            riverwidth: 1,
            coastlinecolor: '#3498db',
            coastlinewidth: 1.5,
            showsubunits: true,
            subunitcolor: '#3498db',
            subunitwidth: 1,
            resolution: 50
        },
        showlegend: true,
        legend: {
            bgcolor: 'rgba(13, 17, 23, 0.95)',
            bordercolor: '#3498db',
            borderwidth: 2,
            font: { size: 12, color: '#ecf0f1', family: 'Courier New, monospace' },
            x: 0.02,
            y: 0.98,
            xanchor: 'left',
            yanchor: 'top'
        },
        height: 700,
        margin: { t: 60, r: 20, b: 20, l: 20 }
    };

    Plotly.newPlot('misiones-map', traces, layout, config);
}

// ============================================
// GRÁFICOS DE DISTRIBUCIÓN
// ============================================

function createDecomisoPlot(data) {
    const counts = countValues(data, 'DECOMISO');
    const top = getTopN(counts, 10);

    const trace = {
        x: top.map(d => d[1]),
        y: top.map(d => d[0]),
        type: 'bar',
        orientation: 'h',
        marker: {
            color: '#3498db',
            line: {
                color: '#2980b9',
                width: 1.5
            }
        },
        hovertemplate: '<b>%{y}</b><br>Casos: %{x}<extra></extra>'
    };

    const layout = {
        ...commonLayout,
        title: {
            text: 'Principales Tipos de Decomisos',
            font: { size: 16, color: '#3498db' }
        },
        xaxis: {
            ...commonLayout.xaxis,
            title: 'Número de Casos'
        },
        yaxis: {
            ...commonLayout.yaxis,
            automargin: true
        },
        height: 500
    };

    Plotly.newPlot('decomiso-plot', [trace], layout, config);
}

function createMovilidadPlot(data) {
    const counts = countValues(data, 'MOVILIDAD');
    const top = getTopN(counts, 10);

    const trace = {
        x: top.map(d => d[1]),
        y: top.map(d => d[0]),
        type: 'bar',
        orientation: 'h',
        marker: {
            color: top.map((_, i) => {
                const colors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6',
                               '#1abc9c', '#e67e22', '#95a5a6', '#16a085', '#34495e'];
                return colors[i];
            }),
            line: {
                color: '#ffffff',
                width: 1
            }
        },
        hovertemplate: '<b>%{y}</b><br>Casos: %{x}<br>Porcentaje: %{customdata:.1f}%<extra></extra>',
        customdata: top.map(d => (d[1] / data.length) * 100)
    };

    const layout = {
        ...commonLayout,
        title: {
            text: 'Distribución de Medios de Transporte',
            font: { size: 16, color: '#3498db' }
        },
        xaxis: {
            ...commonLayout.xaxis,
            title: 'Número de Casos'
        },
        yaxis: {
            ...commonLayout.yaxis,
            automargin: true
        },
        height: 500
    };

    Plotly.newPlot('movilidad-plot', [trace], layout, config);
}

function createSecuestroPlot(data) {
    const counts = countValues(data, 'SECUESTRO');
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);

    const trace = {
        x: entries.map(d => d[0]),
        y: entries.map(d => d[1]),
        type: 'bar',
        marker: {
            color: entries.map((_, i) => {
                const colors = ['#e74c3c', '#f39c12', '#3498db', '#2ecc71', '#9b59b6'];
                return colors[i % colors.length];
            }),
            line: {
                color: '#ffffff',
                width: 1
            }
        },
        hovertemplate: '<b>%{x}</b><br>Casos: %{y}<extra></extra>'
    };

    const layout = {
        ...commonLayout,
        title: {
            text: 'Tipos de Armas y Equipos Secuestrados',
            font: { size: 16, color: '#3498db' }
        },
        xaxis: {
            ...commonLayout.xaxis,
            tickangle: -45,
            automargin: true
        },
        yaxis: {
            ...commonLayout.yaxis,
            title: 'Número de Casos'
        }
    };

    Plotly.newPlot('secuestro-plot', [trace], layout, config);
}

// ============================================
// GRÁFICOS DEMOGRÁFICOS
// ============================================

function createGeneroPlot(data) {
    const counts = countValues(data, 'GENERO');
    const entries = Object.entries(counts);

    const trace = {
        labels: entries.map(d => d[0]),
        values: entries.map(d => d[1]),
        type: 'pie',
        hole: 0.4,
        marker: {
            colors: ['#3498db', '#e74c3c'],
            line: {
                color: '#ffffff',
                width: 2
            }
        },
        textposition: 'inside',
        textinfo: 'label+percent',
        hovertemplate: '<b>%{label}</b><br>Casos: %{value}<br>%{percent}<extra></extra>'
    };

    const layout = {
        ...commonLayout,
        title: {
            text: 'Distribución por Género',
            font: { size: 14, color: '#3498db' }
        },
        showlegend: true,
        legend: {
            bgcolor: 'rgba(21, 27, 35, 0.9)',
            bordercolor: '#2a3442',
            borderwidth: 1
        },
        height: 400
    };

    Plotly.newPlot('genero-plot', [trace], layout, config);
}

function createEdadPlot(data) {
    const counts = countValues(data, 'EDADES');
    const entries = Object.entries(counts);

    // Ordenar por rango etario
    const order = ['21 - 34 años', '35 - 48 años', '49 - 62 años', '63 + años'];
    const sorted = order.map(age => {
        const found = entries.find(e => e[0] === age);
        return found || [age, 0];
    });

    const trace = {
        x: sorted.map(d => d[0]),
        y: sorted.map(d => d[1]),
        type: 'bar',
        marker: {
            color: '#2ecc71',
            line: {
                color: '#27ae60',
                width: 1.5
            }
        },
        hovertemplate: '<b>%{x}</b><br>Casos: %{y}<extra></extra>'
    };

    const layout = {
        ...commonLayout,
        title: {
            text: 'Distribución por Rango Etario',
            font: { size: 14, color: '#3498db' }
        },
        xaxis: {
            ...commonLayout.xaxis,
            tickangle: -45,
            automargin: true
        },
        yaxis: {
            ...commonLayout.yaxis,
            title: 'Número de Casos'
        },
        height: 400
    };

    Plotly.newPlot('edad-plot', [trace], layout, config);
}

// ============================================
// GRÁFICOS SOCIOECONÓMICOS
// ============================================

function createNSEPlot(data) {
    const counts = countValues(data, 'NSE_AGRUP');
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);

    const trace = {
        x: entries.map(d => d[0]),
        y: entries.map(d => d[1]),
        type: 'bar',
        marker: {
            color: '#9b59b6',
            line: {
                color: '#8e44ad',
                width: 1.5
            }
        },
        hovertemplate: '<b>%{x}</b><br>Casos: %{y}<extra></extra>'
    };

    const layout = {
        ...commonLayout,
        title: {
            text: 'Distribución por Nivel Socioeconómico',
            font: { size: 16, color: '#3498db' }
        },
        xaxis: {
            ...commonLayout.xaxis,
            tickangle: -45,
            automargin: true
        },
        yaxis: {
            ...commonLayout.yaxis,
            title: 'Número de Casos'
        }
    };

    Plotly.newPlot('nse-plot', [trace], layout, config);
}

function createMiembrosPlot(data) {
    const counts = countValues(data, 'miembros');
    const entries = Object.entries(counts)
        .map(([k, v]) => [parseInt(k), v])
        .filter(([k, _]) => !isNaN(k))
        .sort((a, b) => a[0] - b[0]);

    const trace = {
        x: entries.map(d => d[0].toString()),
        y: entries.map(d => d[1]),
        type: 'bar',
        marker: {
            color: '#1abc9c',
            line: {
                color: '#16a085',
                width: 1.5
            }
        },
        hovertemplate: '<b>%{x} miembros</b><br>Casos: %{y}<extra></extra>'
    };

    const layout = {
        ...commonLayout,
        title: {
            text: 'Distribución por Número de Miembros',
            font: { size: 16, color: '#3498db' }
        },
        xaxis: {
            ...commonLayout.xaxis,
            title: 'Número de Miembros',
            type: 'category'
        },
        yaxis: {
            ...commonLayout.yaxis,
            title: 'Número de Casos'
        }
    };

    Plotly.newPlot('miembros-plot', [trace], layout, config);
}

// ============================================
// ESTADÍSTICAS GENERALES
// ============================================

function createStatsSection(data) {
    const totalCasos = data.length;

    // Calcular estadísticas
    const conDecomiso = data.filter(d => d.DECOMISO && d.DECOMISO !== 'NA').length;
    const conMovilidad = data.filter(d => d.MOVILIDAD && d.MOVILIDAD !== 'NA').length;
    const conSecuestro = data.filter(d => d.SECUESTRO && d.SECUESTRO !== 'NA').length;

    const miembrosCounts = countValues(data, 'miembros');
    const avgMiembros = Object.entries(miembrosCounts)
        .reduce((sum, [k, v]) => sum + (parseInt(k) * v), 0) / totalCasos;

    const clusters = new Set(data.map(d => d.miembros).filter(m => m && m !== 'NA'));

    const stats = [
        { label: 'Total de Casos', value: totalCasos },
        { label: 'Casos con Decomiso', value: conDecomiso },
        { label: 'Casos con Movilidad', value: conMovilidad },
        { label: 'Casos con Secuestros', value: conSecuestro },
        { label: 'Promedio de Miembros', value: avgMiembros.toFixed(1) },
        { label: 'Clusters Identificados', value: clusters.size }
    ];

    const container = document.getElementById('stats-container');
    container.innerHTML = stats.map(stat => `
        <div class="stat-item">
            <span class="stat-value">${stat.value}</span>
            <span class="stat-label">${stat.label}</span>
        </div>
    `).join('');
}

// ============================================
// CARGA DE DATOS Y INICIALIZACIÓN
// ============================================

async function loadData() {
    try {
        const response = await fetch('data/mca_classes.csv');
        const csvText = await response.text();

        // Parsear CSV
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

        const data = lines.slice(1)
            .filter(line => line.trim())
            .map(line => {
                // Parsear línea respetando comillas
                const values = [];
                let current = '';
                let inQuotes = false;

                for (let i = 0; i < line.length; i++) {
                    const char = line[i];
                    if (char === '"') {
                        inQuotes = !inQuotes;
                    } else if (char === ',' && !inQuotes) {
                        values.push(current.trim());
                        current = '';
                    } else {
                        current += char;
                    }
                }
                values.push(current.trim());

                const obj = {};
                headers.forEach((header, i) => {
                    obj[header] = values[i] || '';
                });
                return obj;
            });

        return data;
    } catch (error) {
        console.error('Error loading data:', error);
        return [];
    }
}

async function initializeDashboard() {
    console.log('Cargando datos...');
    const data = await loadData();

    if (data.length === 0) {
        console.error('No se pudieron cargar los datos');
        return;
    }

    console.log(`Datos cargados: ${data.length} registros`);

    // Crear visualizaciones
    createStatsSection(data);
    createMCAIndividuos(data, 'dim1', 'dim2');
    createMCACategorias(data, 'dim1', 'dim2');
    createMCA3D(data);
    createMisionesMap(data);
    createDecomisoPlot(data);
    createMovilidadPlot(data);
    createSecuestroPlot(data);
    createGeneroPlot(data);
    createEdadPlot(data);
    createNSEPlot(data);
    createMiembrosPlot(data);

    // Agregar event listeners para selectores de ejes
    const individuosAxisX = document.getElementById('individuos-axis-x');
    const individuosAxisY = document.getElementById('individuos-axis-y');
    const categoriasAxisX = document.getElementById('categorias-axis-x');
    const categoriasAxisY = document.getElementById('categorias-axis-y');

    if (individuosAxisX && individuosAxisY) {
        individuosAxisX.addEventListener('change', () => {
            createMCAIndividuos(data, individuosAxisX.value, individuosAxisY.value);
        });
        individuosAxisY.addEventListener('change', () => {
            createMCAIndividuos(data, individuosAxisX.value, individuosAxisY.value);
        });
    }

    if (categoriasAxisX && categoriasAxisY) {
        categoriasAxisX.addEventListener('change', () => {
            createMCACategorias(data, categoriasAxisX.value, categoriasAxisY.value);
        });
        categoriasAxisY.addEventListener('change', () => {
            createMCACategorias(data, categoriasAxisX.value, categoriasAxisY.value);
        });
    }

    console.log('Dashboard inicializado correctamente');
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDashboard);
} else {
    initializeDashboard();
}
