import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isLikelyPersonName } from './person-name-clean.js';
const FALSE_POSITIVES = [
    'Implementación de Filtros y Estandarización de Datos',
    'Implementación de preventas',
    'Implementación de la nueva versión de la aplicación Directorio',
    'Implementación de Lógica de Cancelación y Fin de Flujo',
    'Implementación de la automatización en el área de influencers',
    'Implementación de fórmulas y validación de acceso',
    'Implementación de Notificaciones y Alertas',
    'Implementación de la API de Google para el Proyecto de Noe',
    'Implementación de la corrección en la vista de exportación',
    'Implementación de Encuestas con Nitro y Google Forms',
    'Implementación de la Etapa Dos y Uso de Deep Links',
    'Implementación de lista de países',
    'Implementación de los "Vitales" para la autonomía del DT',
    'Implementación de estados de tarea personalizados',
    'Implementación de despliegues y feedback',
    'Implementación de la Variable de Rollback y Acceso de Usuarios',
    'Implementación de fases y modelo de IA',
    'Implementación de Evaluaciones de Desempeño en Nitro',
    'Implementación de Nuevas Vistas de Proyectos en Nexolaps',
    'Implementación de cuentas de imputación múltiples por OS',
    'Implementación de la limpieza de datos (curación) en contactos',
    'Implementación de Deep Link y URLs en PDF',
    'Implementación de la Edición de la Compañía Telefónica en Flota',
    'Implementación de la Función VLOOKUP',
    'Implementación de la lógica condicional para vistas',
];
describe('isLikelyPersonName', () => {
    for (const label of FALSE_POSITIVES) {
        it(`rechaza tema de agenda: ${label.slice(0, 48)}…`, () => {
            assert.equal(isLikelyPersonName(label), false);
        });
    }
    it('acepta nombres plausibles', () => {
        assert.equal(isLikelyPersonName('Lucas Mazalan'), true);
        assert.equal(isLikelyPersonName('María García'), true);
        assert.equal(isLikelyPersonName('Noe'), true);
    });
    it('rechaza etiquetas de sección cortas', () => {
        assert.equal(isLikelyPersonName('Próximos pasos'), false);
        assert.equal(isLikelyPersonName('Próximos pasos y programación'), false);
    });
    const USER_FALSE_POSITIVES = [
        'Problemas técnicos y clima',
        'Protocolos de Inteligencia Artificial',
        'Presentación del proceso de contrataciones',
        'Propuesta de miniaplicación para evaluaciones',
        'Situación de los entregables DPX',
        'Rendimiento de la IA Turbo',
        'Simplificación del Acceso a Triggers',
    ];
    for (const label of USER_FALSE_POSITIVES) {
        it(`rechaza tema de reunión (mantenimiento): ${label.slice(0, 42)}`, () => {
            assert.equal(isLikelyPersonName(label), false);
        });
    }
});
