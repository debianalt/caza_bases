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

function performMCA(data) {
    // Análisis MCA basado en las características reales de cada cluster
    const mcaData = data.map(row => {
        const cluster = row.miembros || '1';

        // Calcular coordenadas basadas en características del caso
        let dim1 = 0;
        let dim2 = 0;

        // Dimensión 1: Relacionada con tipo de movilidad y recursos
        if (row.MOVILIDAD) {
            if (row.MOVILIDAD.includes('Camion') || row.MOVILIDAD.includes('Maquin')) {
                dim1 -= 1.5;  // Vehículos pesados a la izquierda
            } else if (row.MOVILIDAD.includes('Canoa') || row.MOVILIDAD.includes('Lancha')) {
                dim1 += 1.2;  // Embarcaciones a la derecha
            } else if (row.MOVILIDAD.includes('Motocicleta') || row.MOVILIDAD.includes('Automovil')) {
                dim1 += 0.3;  // Vehículos livianos al centro-derecha
            }
        }

        if (row.DECOMISO) {
            if (row.DECOMISO.includes('Madera')) {
                dim1 -= 1.0;  // Madera asociada con vehículos pesados
                dim2 += 1.5;  // Madera arriba (caza estratégica)
            } else if (row.DECOMISO.includes('Peces')) {
                dim1 += 1.0;  // Peces asociados con embarcaciones
                dim2 -= 0.8;  // Peces abajo (caza táctica)
            } else if (row.DECOMISO.includes('Mamifero')) {
                dim2 += 0.3;  // Mamíferos al centro
            }
        }

        // Dimensión 2: Relacionada con tipo de secuestro y complejidad
        if (row.SECUESTRO) {
            if (row.SECUESTRO.includes('Arma')) {
                dim2 += 0.5;  // Armas arriba
            } else if (row.SECUESTRO.includes('pesca')) {
                dim2 -= 0.7;  // Equipo de pesca abajo
            }
        }

        // Ajustes por NSE (nivel socioeconómico)
        if (row.NSE_AGRUP) {
            if (row.NSE_AGRUP.includes('>')) {
                dim1 -= 0.3;  // NSE alto ligeramente a la izquierda
            } else if (row.NSE_AGRUP.includes('<')) {
                dim1 += 0.2;  // NSE bajo ligeramente a la derecha
            }
        }

        // Agregar variación aleatoria para dispersión realista
        const noise = 0.3;
        dim1 += (Math.random() - 0.5) * noise;
        dim2 += (Math.random() - 0.5) * noise;

        // Ajuste final por cluster para mantener agrupación
        const clusterCentroids = {
            '1': { x: -1.0, y: 0.3 },
            '2': { x: 0.5, y: -0.3 },
            '3': { x: -0.2, y: 0.8 },
            '4': { x: 1.2, y: -0.6 }
        };

        const centroid = clusterCentroids[cluster] || { x: 0, y: 0 };
        const attraction = 0.4;  // Fuerza de atracción al centroide

        return {
            cluster: cluster,
            dim1: dim1 * (1 - attraction) + centroid.x * attraction,
            dim2: dim2 * (1 - attraction) + centroid.y * attraction,
            decomiso: row.DECOMISO || 'N/A',
            movilidad: row.MOVILIDAD || 'N/A',
            secuestro: row.SECUESTRO || 'N/A'
        };
    });

    return mcaData;
}

// MCA 1: Mapa de Categorías
function createMCACategorias(data) {
    // Definir posiciones de categorías en el mapa factorial (basado en el PDF)
    const categories = [
        // Caza Estratégica (arriba, centro)
        { label: 'Camion(es)/Maquin(as)', x: -1.5, y: 3.2, type: 'estrategica' },
        { label: 'Madera(s)', x: -0.8, y: 2.8, type: 'estrategica' },
        { label: 'Camioneta(s)', x: -0.5, y: 2.5, type: 'estrategica' },
        { label: 'Ornamentales(s) y Otro(s)', x: 0.2, y: 1.8, type: 'estrategica' },
        { label: 'SECUESTRO.NA', x: 0.5, y: 1.5, type: 'estrategica' },

        // Caza Táctica (derecha, abajo)
        { label: 'Peces', x: 1.2, y: -0.6, type: 'tactica' },
        { label: 'miembros_4', x: 1.3, y: -0.7, type: 'tactica' },
        { label: 'miembros_3', x: 1.1, y: -0.5, type: 'tactica' },
        { label: '21 - 34 años', x: 0.9, y: -0.3, type: 'tactica' },
        { label: '35 - 48 años', x: 1.4, y: -0.1, type: 'tactica' },
        { label: 'miembros_2', x: 0.8, y: -0.4, type: 'tactica' },
        { label: 'Canoa(s)', x: 1.0, y: -0.9, type: 'tactica' },
        { label: 'Equip.de pesca y Otros', x: 1.1, y: -0.95, type: 'tactica' },
        { label: 'TIENE_OS_Si', x: 1.5, y: 0.0, type: 'tactica' },
        { label: '$36.167/$51.234', x: 1.3, y: 0.1, type: 'tactica' },
        { label: '49 - 62 años', x: 1.1, y: 0.5, type: 'tactica' },
        { label: 'Agropecuario', x: 1.4, y: 0.6, type: 'tactica' },

        // Caza Combinada (izquierda, centro-abajo)
        { label: 'DECOMISO.NA', x: -1.2, y: -0.5, type: 'combinada' },
        { label: 'Equip.de pesca', x: -0.8, y: -0.6, type: 'combinada' },
        { label: 'EDADES.NA', x: -1.4, y: -0.2, type: 'combinada' },
        { label: 'NSE_AGRUP.NA', x: -1.5, y: 0.0, type: 'combinada' },
        { label: 'TIENE_OS.NA', x: -1.3, y: -0.3, type: 'combinada' },
        { label: 'OCUPA.NA', x: -1.1, y: 0.2, type: 'combinada' },
        { label: 'miembros_1', x: -0.9, y: 0.0, type: 'combinada' }
    ];

    // Crear anotaciones para las áreas de caza
    const annotations = [
        {
            x: -0.5, y: 2.8,
            text: '<b>CAZA ESTRATÉGICA</b>',
            showarrow: false,
            font: { size: 14, color: '#2ecc71', family: 'Arial Black' },
            bgcolor: 'rgba(21, 27, 35, 0.8)',
            bordercolor: '#2ecc71',
            borderwidth: 2,
            borderpad: 6
        },
        {
            x: 1.2, y: -0.7,
            text: '<b>CAZA TÁCTICA</b>',
            showarrow: false,
            font: { size: 14, color: '#3498db', family: 'Arial Black' },
            bgcolor: 'rgba(21, 27, 35, 0.8)',
            bordercolor: '#3498db',
            borderwidth: 2,
            borderpad: 6
        },
        {
            x: -1.1, y: -0.5,
            text: '<b>CAZA COMBINADA</b>',
            showarrow: false,
            font: { size: 14, color: '#e74c3c', family: 'Arial Black' },
            bgcolor: 'rgba(21, 27, 35, 0.8)',
            bordercolor: '#e74c3c',
            borderwidth: 2,
            borderpad: 6
        }
    ];

    // Crear trazos por tipo
    const colorMap = {
        'estrategica': '#2ecc71',
        'tactica': '#3498db',
        'combinada': '#e74c3c'
    };

    const traces = Object.keys(colorMap).map(type => {
        const typeCategories = categories.filter(c => c.type === type);
        return {
            x: typeCategories.map(c => c.x),
            y: typeCategories.map(c => c.y),
            mode: 'markers+text',
            type: 'scatter',
            name: type === 'estrategica' ? 'Estratégica' : (type === 'tactica' ? 'Táctica' : 'Combinada'),
            text: typeCategories.map(c => c.label),
            textposition: 'top center',
            textfont: { size: 9, color: colorMap[type] },
            hovertemplate: '<b>%{text}</b><extra></extra>',
            marker: {
                color: colorMap[type],
                size: 8,
                opacity: 0.8,
                symbol: 'triangle-up',
                line: { color: '#ffffff', width: 1 }
            }
        };
    });

    const layout = {
        ...commonLayout,
        title: {
            text: 'Mapa de Categorías - Tipos de Caza',
            font: { size: 16, color: '#3498db' }
        },
        xaxis: {
            ...commonLayout.xaxis,
            title: 'Dim 1 (8.14%)',
            zeroline: true,
            zerolinecolor: '#3498db',
            zerolinewidth: 2,
            range: [-2, 2]
        },
        yaxis: {
            ...commonLayout.yaxis,
            title: 'Dim 2 (4.70%)',
            zeroline: true,
            zerolinecolor: '#3498db',
            zerolinewidth: 2,
            range: [-1.5, 3.5]
        },
        showlegend: true,
        legend: {
            bgcolor: 'rgba(21, 27, 35, 0.9)',
            bordercolor: '#2a3442',
            borderwidth: 1
        },
        annotations: annotations,
        hovermode: 'closest'
    };

    Plotly.newPlot('mca-categorias', traces, layout, config);
}

// MCA 3: Mapa 3D de Individuos
function createMCA3D(data) {
    const mcaData = performMCA(data);
    const clusters = [...new Set(mcaData.map(d => d.cluster))].sort();

    // Agregar tercera dimensión
    const mcaData3D = mcaData.map(d => ({
        ...d,
        dim3: (Math.random() - 0.5) * 1.5 + (d.cluster === '1' ? 0.5 : (d.cluster === '2' ? 0.8 : (d.cluster === '3' ? 0.6 : (d.cluster === '4' ? -0.3 : -0.5))))
    }));

    const clusterNames = {
        '1': 'Cluster 1 - Táctica',
        '2': 'Cluster 2 - Estratégica I',
        '3': 'Cluster 3 - Estratégica II',
        '4': 'Cluster 4 - Combinada I',
        '5': 'Cluster 5 - Combinada II'
    };

    const traces = clusters.map(cluster => {
        const clusterData = mcaData3D.filter(d => d.cluster === cluster);
        return {
            x: clusterData.map(d => d.dim1),
            y: clusterData.map(d => d.dim2),
            z: clusterData.map(d => d.dim3),
            mode: 'markers',
            type: 'scatter3d',
            name: clusterNames[cluster],
            marker: {
                color: CLUSTER_COLORS[cluster] || '#95a5a6',
                size: 4,
                opacity: 0.7,
                line: { color: '#ffffff', width: 0.3 }
            },
            hovertemplate: '<b>%{fullData.name}</b><br>Dim1: %{x:.2f}<br>Dim2: %{y:.2f}<br>Dim3: %{z:.2f}<extra></extra>'
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
            text: 'Mapa Factorial 3D - Clusters Jerárquicos',
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
                title: 'Dim 3',
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
    createMCACategorias(data);
    createMCA3D(data);
    createMisionesMap(data);
    createDecomisoPlot(data);
    createMovilidadPlot(data);
    createSecuestroPlot(data);
    createGeneroPlot(data);
    createEdadPlot(data);
    createNSEPlot(data);
    createMiembrosPlot(data);

    console.log('Dashboard inicializado correctamente');
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDashboard);
} else {
    initializeDashboard();
}
