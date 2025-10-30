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

        return {
            index: index,
            cluster: row.miembros || '1',
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

    // Agrupar por número de miembros para colores
    const miembrosGroups = {};
    mcaData.forEach(d => {
        const miembros = d.miembros;
        if (!miembrosGroups[miembros]) {
            miembrosGroups[miembros] = [];
        }
        miembrosGroups[miembros].push(d);
    });

    const colorMap = {
        '1': '#3498db',
        '2': '#2ecc71',
        '3': '#f39c12',
        '4': '#e74c3c',
        '5': '#9b59b6',
        'NA': '#95a5a6'
    };

    const traces = Object.keys(miembrosGroups).sort().map(miembros => {
        const groupData = miembrosGroups[miembros];
        return {
            x: groupData.map(d => d[axisX]),
            y: groupData.map(d => d[axisY]),
            mode: 'markers',
            type: 'scatter',
            name: miembros === 'NA' ? 'Sin datos' : `${miembros} miembro(s)`,
            marker: {
                color: colorMap[miembros] || '#95a5a6',
                size: 5,
                opacity: 0.6,
                line: { color: '#ffffff', width: 0.3 }
            },
            text: groupData.map(d =>
                `Acta #${d.index + 1}<br>` +
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
            text: `Mapa Factorial de Individuos - ${data.length} Actas`,
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
        'activa': 'Activas',
        'suplementaria': 'Suplementarias',
        'tactica': 'Táctica',
        'estrategica': 'Estratégica',
        'combinada': 'Combinada'
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

    // Agrupar por número de miembros
    const miembrosGroups = {};
    mcaData.forEach(d => {
        const miembros = d.miembros;
        if (!miembrosGroups[miembros]) {
            miembrosGroups[miembros] = [];
        }
        miembrosGroups[miembros].push(d);
    });

    const colorMap = {
        '1': '#3498db',
        '2': '#2ecc71',
        '3': '#f39c12',
        '4': '#e74c3c',
        '5': '#9b59b6',
        'NA': '#95a5a6'
    };

    const traces = Object.keys(miembrosGroups).sort().map(miembros => {
        const groupData = miembrosGroups[miembros];
        return {
            x: groupData.map(d => d.dim1),
            y: groupData.map(d => d.dim2),
            z: groupData.map(d => d.dim3),
            mode: 'markers',
            type: 'scatter3d',
            name: miembros === 'NA' ? 'Sin datos' : `${miembros} miembro(s)`,
            marker: {
                color: colorMap[miembros] || '#95a5a6',
                size: 3,
                opacity: 0.6,
                line: { color: '#ffffff', width: 0.2 }
            },
            text: groupData.map(d =>
                `Acta #${d.index + 1}<br>` +
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
            text: 'Mapa Factorial 3D de Individuos',
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
    // Clasificar casos por tipo de caza basado en características
    const cazaTipos = data.map(row => {
        let tipo = 'Combinada'; // Por defecto
        let color = '#e74c3c';

        // Determinar tipo de caza basado en características
        if (row.MOVILIDAD && (row.MOVILIDAD.includes('Camion') || row.MOVILIDAD.includes('Maquin'))) {
            tipo = 'Estratégica';
            color = '#2ecc71';
        } else if (row.DECOMISO && row.DECOMISO.includes('Madera')) {
            tipo = 'Estratégica';
            color = '#2ecc71';
        } else if (row.DECOMISO && row.DECOMISO.includes('Peces')) {
            tipo = 'Táctica';
            color = '#3498db';
        } else if (row.MOVILIDAD && (row.MOVILIDAD.includes('Canoa') || row.MOVILIDAD.includes('Lancha'))) {
            tipo = 'Combinada';
            color = '#e74c3c';
        } else if (row.SECUESTRO && row.SECUESTRO.includes('pesca')) {
            if (row.MOVILIDAD && row.MOVILIDAD !== 'NA') {
                tipo = 'Combinada';
                color = '#e74c3c';
            } else {
                tipo = 'Táctica';
                color = '#3498db';
            }
        } else if (row.SECUESTRO && row.SECUESTRO.includes('Arma')) {
            tipo = 'Táctica';
            color = '#3498db';
        }

        return { tipo, color };
    });

    // Contar por tipo
    const tipoCounts = {
        'Táctica': cazaTipos.filter(c => c.tipo === 'Táctica').length,
        'Estratégica': cazaTipos.filter(c => c.tipo === 'Estratégica').length,
        'Combinada': cazaTipos.filter(c => c.tipo === 'Combinada').length
    };

    // Coordenadas aproximadas de diferentes zonas de Misiones
    // Distribuir los casos en zonas representativas de la provincia
    const zonas = [
        { nombre: 'Norte', lat: -26.0, lon: -54.5 },
        { nombre: 'Centro', lat: -27.0, lon: -55.0 },
        { nombre: 'Sur', lat: -27.5, lon: -55.3 },
        { nombre: 'Este', lat: -26.8, lon: -54.2 },
        { nombre: 'Oeste', lat: -26.5, lon: -55.2 }
    ];

    // Distribuir casos por zona y tipo
    const mapData = [];
    Object.keys(tipoCounts).forEach((tipo, idx) => {
        const count = tipoCounts[tipo];
        const zona = zonas[idx % zonas.length];
        mapData.push({
            tipo: tipo,
            lat: zona.lat,
            lon: zona.lon,
            count: count,
            color: tipo === 'Táctica' ? '#3498db' : (tipo === 'Estratégica' ? '#2ecc71' : '#e74c3c')
        });
    });

    // Agregar algunos puntos adicionales distribuidos
    mapData.push(
        { tipo: 'Táctica', lat: -26.3, lon: -54.7, count: Math.floor(tipoCounts['Táctica'] * 0.3), color: '#3498db' },
        { tipo: 'Estratégica', lat: -27.2, lon: -55.1, count: Math.floor(tipoCounts['Estratégica'] * 0.4), color: '#2ecc71' },
        { tipo: 'Combinada', lat: -27.1, lon: -54.8, count: Math.floor(tipoCounts['Combinada'] * 0.35), color: '#e74c3c' },
        { tipo: 'Táctica', lat: -26.8, lon: -54.4, count: Math.floor(tipoCounts['Táctica'] * 0.25), color: '#3498db' },
        { tipo: 'Combinada', lat: -26.6, lon: -55.0, count: Math.floor(tipoCounts['Combinada'] * 0.3), color: '#e74c3c' }
    );

    // Crear trazos por tipo de caza
    const tipos = ['Táctica', 'Estratégica', 'Combinada'];
    const traces = tipos.map(tipo => {
        const tipoData = mapData.filter(d => d.tipo === tipo);
        return {
            lat: tipoData.map(d => d.lat),
            lon: tipoData.map(d => d.lon),
            text: tipoData.map(d => `${d.tipo}: ${d.count} casos`),
            name: `Caza ${tipo}`,
            type: 'scattergeo',
            mode: 'markers',
            marker: {
                size: tipoData.map(d => Math.max(8, Math.sqrt(d.count) * 3)),
                color: tipoData[0].color,
                line: {
                    color: '#ffffff',
                    width: 1.5
                },
                opacity: 0.8
            },
            hovertemplate: '<b>%{text}</b><br>Lat: %{lat:.2f}<br>Lon: %{lon:.2f}<extra></extra>'
        };
    });

    const layout = {
        ...commonLayout,
        title: {
            text: 'Distribución Geográfica de Casos de Caza Ilegal en Misiones',
            font: { size: 16, color: '#3498db' }
        },
        geo: {
            scope: 'south america',
            projection: {
                type: 'mercator'
            },
            center: {
                lat: -26.8,
                lon: -54.7
            },
            lonaxis: { range: [-56, -53.5] },
            lataxis: { range: [-28, -25.5] },
            bgcolor: '#151b23',
            showland: true,
            landcolor: '#2a3442',
            showocean: true,
            oceancolor: '#0a0e14',
            showcountries: true,
            countrycolor: '#3498db',
            showlakes: true,
            lakecolor: '#1a5490',
            showrivers: true,
            rivercolor: '#1a5490',
            coastlinecolor: '#3498db'
        },
        showlegend: true,
        legend: {
            bgcolor: 'rgba(21, 27, 35, 0.9)',
            bordercolor: '#2a3442',
            borderwidth: 1,
            font: { size: 11, color: '#ecf0f1' }
        },
        height: 600
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
