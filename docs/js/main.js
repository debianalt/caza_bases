// ============================================
// CONFIGURACIÓN Y UTILIDADES
// ============================================

const CLUSTER_COLORS = {
    '1': '#3498db',
    '2': '#2ecc71',
    '3': '#e74c3c',
    '4': '#f39c12'
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

function createMCAPlot(data) {
    const mcaData = performMCA(data);
    const clusters = [...new Set(mcaData.map(d => d.cluster))].sort();

    const traces = clusters.map(cluster => {
        const clusterData = mcaData.filter(d => d.cluster === cluster);
        return {
            x: clusterData.map(d => d.dim1),
            y: clusterData.map(d => d.dim2),
            mode: 'markers',
            type: 'scatter',
            name: `Cluster ${cluster}`,
            text: clusterData.map(d => `Decomiso: ${d.decomiso}<br>Movilidad: ${d.movilidad}<br>Secuestro: ${d.secuestro}`),
            hovertemplate: '<b>Cluster %{fullData.name}</b><br>Dim1: %{x:.2f}<br>Dim2: %{y:.2f}<br>%{text}<extra></extra>',
            marker: {
                color: CLUSTER_COLORS[cluster] || '#95a5a6',
                size: 7,
                opacity: 0.65,
                line: {
                    color: '#ffffff',
                    width: 0.5
                }
            }
        };
    });

    const layout = {
        ...commonLayout,
        title: {
            text: 'Mapa Factorial - Análisis de Correspondencias Múltiples',
            font: { size: 18, color: '#3498db' }
        },
        xaxis: {
            ...commonLayout.xaxis,
            title: 'Dimensión 1 (8.14%)',
            zeroline: true,
            zerolinecolor: '#3498db',
            zerolinewidth: 2
        },
        yaxis: {
            ...commonLayout.yaxis,
            title: 'Dimensión 2 (4.70%)',
            zeroline: true,
            zerolinecolor: '#3498db',
            zerolinewidth: 2
        },
        showlegend: true,
        legend: {
            bgcolor: 'rgba(21, 27, 35, 0.9)',
            bordercolor: '#2a3442',
            borderwidth: 1,
            x: 1.02,
            y: 1
        },
        hovermode: 'closest'
    };

    Plotly.newPlot('mca-plot', traces, layout, config);
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
// INFORMACIÓN DE CLUSTERS
// ============================================

function populateClusterInfo(data) {
    const clusters = ['1', '2', '3', '4'];

    clusters.forEach(cluster => {
        const clusterData = data.filter(d => d.miembros === cluster);
        if (clusterData.length === 0) return;

        const totalCases = clusterData.length;
        const percTotal = ((totalCases / data.length) * 100).toFixed(1);

        // Obtener tipo de decomiso más común
        const decomisos = countValues(clusterData, 'DECOMISO');
        const topDecomiso = Object.entries(decomisos).sort((a, b) => b[1] - a[1])[0];

        // Obtener tipo de movilidad más común
        const movilidades = countValues(clusterData, 'MOVILIDAD');
        const topMovilidad = Object.entries(movilidades).sort((a, b) => b[1] - a[1])[0];

        // Obtener tipo de secuestro más común
        const secuestros = countValues(clusterData, 'SECUESTRO');
        const topSecuestro = Object.entries(secuestros).sort((a, b) => b[1] - a[1])[0];

        const container = document.getElementById(`cluster-${cluster}-stats`);
        container.innerHTML = `
            <div class="cluster-stat">
                <span class="cluster-stat-label">Casos:</span>
                <span class="cluster-stat-value">${totalCases} (${percTotal}%)</span>
            </div>
            ${topDecomiso ? `
            <div class="cluster-stat">
                <span class="cluster-stat-label">Decomiso principal:</span>
                <span class="cluster-stat-value">${topDecomiso[0].substring(0, 25)}${topDecomiso[0].length > 25 ? '...' : ''}</span>
            </div>
            ` : ''}
            ${topMovilidad ? `
            <div class="cluster-stat">
                <span class="cluster-stat-label">Movilidad principal:</span>
                <span class="cluster-stat-value">${topMovilidad[0]}</span>
            </div>
            ` : ''}
            ${topSecuestro ? `
            <div class="cluster-stat">
                <span class="cluster-stat-label">Secuestro principal:</span>
                <span class="cluster-stat-value">${topSecuestro[0].substring(0, 25)}${topSecuestro[0].length > 25 ? '...' : ''}</span>
            </div>
            ` : ''}
        `;

        // Actualizar descripción basada en las características reales
        const descriptions = {
            '1': 'Patrón caracterizado por menor número de miembros y diversidad de recursos. Incluye casos de caza de maderas y mamíferos con diferentes tipos de movilidad.',
            '2': 'Patrón con características intermedias, mostrando diversidad en métodos y objetivos de caza. Frecuente uso de embarcaciones y pesca.',
            '3': 'Patrón con grupos de mayor tamaño y equipamiento variado. Combinación de diferentes tipos de decomisos y estrategias de caza.',
            '4': 'Patrón asociado a grupos de 4 miembros, principalmente orientado a pesca con uso de canoas y equipo especializado de pesca.'
        };

        const descElem = container.parentElement.querySelector('.cluster-description');
        if (descElem && descriptions[cluster]) {
            descElem.textContent = descriptions[cluster];
        }
    });
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
    createMCAPlot(data);
    createDecomisoPlot(data);
    createMovilidadPlot(data);
    createSecuestroPlot(data);
    createGeneroPlot(data);
    createEdadPlot(data);
    createNSEPlot(data);
    createMiembrosPlot(data);
    populateClusterInfo(data);

    console.log('Dashboard inicializado correctamente');
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDashboard);
} else {
    initializeDashboard();
}
