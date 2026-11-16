# Planificacion-y-mantenimiento-de-una-red-comunitaria-de-agua-potable-con-telemetria
Un municipio rural quiere mejorar su red de agua potable. Hay un tanque principal, varios caseríos, estaciones de bombeo y medidores de consumo. 

Se necesita:

Decidir por dónde tender tuberías nuevas para conectar todos los caseríos al tanque con el menor costo total posible.

Recorrer e inspeccionar la red para detectar ciclos, tramos aislados y rutas de mantenimiento.

Registrar y buscar medidores por código.

Ordenar y priorizar solicitudes de reparación.

Asignar técnicos a averías según urgencia.

Comprimir los mensajes de telemetría de los sensores para ahorrar ancho de banda.

Comparar históricos de consumo para detectar anomalías.

## Página interactiva

Abre `index.html` en un navegador moderno para recorrer la explicación y probar las demostraciones. La página está hecha con HTML, CSS y JavaScript sin dependencias ni servidor:

- Kruskal y Prim resaltan paso a paso los tramos del árbol de expansión mínimo.
- BFS y DFS muestran el orden de visita desde el origen elegido.
- El BST permite buscar códigos de medidor; Bubble Sort muestra las pasadas de priorización y Greedy distribuye las solicitudes entre dos técnicos.
- LCS calcula la subsecuencia común y presenta su matriz de programación dinámica.
- Huffman construye un árbol a partir del mensaje, presenta los códigos prefijo y permite verificar la codificación y decodificación.

Los datos son demostrativos. Los costos del grafo se expresan en millones; el ejemplo de Huffman compara bits codificados con el tamaño UTF-8 sin incluir el costo de transmitir el árbol o sus metadatos.

## Ejecutar los algoritmos Python

Desde esta carpeta, en PowerShell:

```powershell
$env:PYTHONIOENCODING = "utf-8"
python .\proyecto.py
python -m unittest discover -s .\tests -v
```

La implementación Huffman expone `construir_arbol_huffman`, `generar_codigos_huffman`, `codificar_huffman`, `decodificar_huffman` y `comprimir_huffman` en `proyecto.py`. Los mensajes vacíos producen un árbol vacío; para mensajes de un único símbolo se usa el código `0`.
