from collections import Counter, deque
import heapq
from itertools import count

# 1. DATOS DEL PROBLEMA
ARISTAS = [
    ("T","A",4), ("T","B",6), ("T","E",5),
    ("A","B",2), ("A","C",7),
    ("B","C",3), ("B","E",4), ("B","D",8),
    ("C","D",5), ("C","F",6),
    ("D","F",2), ("D","E",7),
    ("E","F",9),
]

NODOS = ["T","A","B","C","D","E","F"]

# 2. LISTA DE ADYACENCIA
def construir_lista_adyacencia(aristas, nodos):
    """Devuelve dict: nodo -> [(vecino, costo), ...]."""
    adj = {n: [] for n in nodos}
    for u, v, w in aristas:
        adj[u].append((v, w))
        adj[v].append((u, w))
    return adj

# 3. KRUSKAL (MST)
class UnionFind:
    def __init__(self, nodos):
        self.padre = {n: n for n in nodos}
        self.rango = {n: 0 for n in nodos}

    def find(self, x):
        while self.padre[x] != x:
            self.padre[x] = self.padre[self.padre[x]]
            x = self.padre[x]
        return x

    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return False
        if self.rango[ra] < self.rango[rb]:
            ra, rb = rb, ra
        self.padre[rb] = ra
        if self.rango[ra] == self.rango[rb]:
            self.rango[ra] += 1
        return True

def kruskal(aristas, nodos):
    uf = UnionFind(nodos)
    mst, costo = [], 0
    for u, v, w in sorted(aristas, key=lambda e: e[2]):
        if uf.union(u, v):
            mst.append((u, v, w))
            costo += w
            if len(mst) == len(nodos) - 1:
                break
    return mst, costo

# 4. PRIM (MST desde un nodo)
def prim(adj, inicio):
    visitados = set([inicio])
    heap = [(w, inicio, v) for v, w in adj[inicio]]
    heapq.heapify(heap)
    mst, costo = [], 0
    while heap and len(visitados) < len(adj):
        w, u, v = heapq.heappop(heap)
        if v in visitados:
            continue
        visitados.add(v)
        mst.append((u, v, w))
        costo += w
        for vecino, peso in adj[v]:
            if vecino not in visitados:
                heapq.heappush(heap, (peso, v, vecino))
    return mst, costo

# 5. BFS (niveles / saltos desde un origen)
def bfs(adj, origen):
    dist = {origen: 0}
    cola = deque([origen])
    orden = []
    while cola:
        u = cola.popleft()
        orden.append(u)
        for v, _ in adj[u]:
            if v not in dist:
                dist[v] = dist[u] + 1
                cola.append(v)
    return dist, orden

# 6. DFS (recorrido profundo + detección de ciclos)
def dfs(adj, origen):
    visitados, orden, ciclos = set(), [], []
    def _dfs(u, padre):
        visitados.add(u)
        orden.append(u)
        for v, _ in adj[u]:
            if v not in visitados:
                _dfs(v, u)
            elif v != padre:
                # arista de retroceso -> ciclo
                ciclos.append((u, v))
    _dfs(origen, None)
    return orden, ciclos

# 7. BST (árbol binario de búsqueda de medidores)
class NodoBST:
    def __init__(self, codigo, ubicacion):
        self.codigo = codigo
        self.ubicacion = ubicacion
        self.izq = None
        self.der = None

def insertar(raiz, codigo, ubicacion):
    if raiz is None:
        return NodoBST(codigo, ubicacion)
    if codigo < raiz.codigo:
        raiz.izq = insertar(raiz.izq, codigo, ubicacion)
    elif codigo > raiz.codigo:
        raiz.der = insertar(raiz.der, codigo, ubicacion)
    return raiz

def buscar(raiz, codigo, pasos=[0]):
    if raiz is None:
        return None
    pasos[0] += 1
    if codigo == raiz.codigo:
        return raiz
    if codigo < raiz.codigo:
        return buscar(raiz.izq, codigo, pasos)
    return buscar(raiz.der, codigo, pasos)

def in_order(raiz, acc=None):
    if acc is None:
        acc = []
    if raiz:
        in_order(raiz.izq, acc)
        acc.append((raiz.codigo, raiz.ubicacion))
        in_order(raiz.der, acc)
    return acc

# 8. BUBBLE SORT (priorización de reparaciones)
def bubble_sort_reparaciones(solicitudes):
    """solicitudes: lista de (id, descripcion, urgencia)."""
    arr = solicitudes[:]
    n = len(arr)
    for i in range(n):
        intercambiado = False
        for j in range(0, n - i - 1):
            if arr[j][2] < arr[j + 1][2]:   # descendente por urgencia
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                intercambiado = True
        if not intercambiado:
            break
    return arr

# 9. GREEDY (asignación de técnicos)
def asignar_tecnicos_greedy(solicitudes_ordenadas, num_tecnicos=2):
    """Cada técnico toma la siguiente solicitud más urgente disponible."""
    tecnicos = [{"id": i + 1, "libre_en": 0, "tareas": []}
                for i in range(num_tecnicos)]
    tiempos = {  # tiempo estimado por id de solicitud
        "R1": 2, "R2": 3, "R3": 1, "R4": 2, "R5": 1,
    }
    for sid, desc, urg in solicitudes_ordenadas:
        tecnico = min(tecnicos, key=lambda t: t["libre_en"])
        inicio = tecnico["libre_en"]
        duracion = tiempos.get(sid, 1)
        tecnico["tareas"].append((sid, desc, inicio, inicio + duracion))
        tecnico["libre_en"] = inicio + duracion
    return tecnicos

# 10. LCS (comparar históricos de consumo)
def lcs(s1, s2):
    n, m = len(s1), len(s2)
    dp = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            if s1[i - 1] == s2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
    # reconstrucción
    i, j, secuencia = n, m, []
    while i > 0 and j > 0:
        if s1[i - 1] == s2[j - 1]:
            secuencia.append(s1[i - 1])
            i -= 1; j -= 1
        elif dp[i - 1][j] >= dp[i][j - 1]:
            i -= 1
        else:
            j -= 1
    return dp[n][m], list(reversed(secuencia))

# 11. HUFFMAN (compresión de mensajes de telemetría)
class NodoHuffman:
    def __init__(self, simbolo=None, frecuencia=0, izq=None, der=None):
        self.simbolo = simbolo
        self.frecuencia = frecuencia
        self.izq = izq
        self.der = der

def construir_arbol_huffman(texto):
    frecuencias = Counter(texto)
    if not frecuencias:
        return None

    orden = count()
    heap = [
        (frecuencia, next(orden), NodoHuffman(simbolo, frecuencia))
        for simbolo, frecuencia in frecuencias.items()
    ]
    heapq.heapify(heap)

    while len(heap) > 1:
        frecuencia_izq, _, izq = heapq.heappop(heap)
        frecuencia_der, _, der = heapq.heappop(heap)
        padre = NodoHuffman(
            frecuencia=frecuencia_izq + frecuencia_der,
            izq=izq,
            der=der,
        )
        heapq.heappush(heap, (padre.frecuencia, next(orden), padre))

    return heap[0][2]

def generar_codigos_huffman(raiz):
    codigos = {}

    def recorrer(nodo, prefijo):
        if nodo is None:
            return
        if nodo.simbolo is not None:
            codigos[nodo.simbolo] = prefijo or "0"
            return
        recorrer(nodo.izq, prefijo + "0")
        recorrer(nodo.der, prefijo + "1")

    recorrer(raiz, "")
    return codigos

def codificar_huffman(texto, codigos):
    try:
        return "".join(codigos[simbolo] for simbolo in texto)
    except KeyError as error:
        raise ValueError(f"Símbolo sin código Huffman: {error.args[0]!r}") from error

def decodificar_huffman(bits, raiz):
    if any(bit not in "01" for bit in bits):
        raise ValueError("El mensaje codificado solo puede contener 0 y 1.")
    if raiz is None:
        if bits:
            raise ValueError("No se puede decodificar bits sin un árbol Huffman.")
        return ""
    if raiz.simbolo is not None:
        if "1" in bits:
            raise ValueError("El árbol de un solo símbolo solo admite el código 0.")
        return raiz.simbolo * len(bits)

    resultado = []
    actual = raiz
    for bit in bits:
        actual = actual.izq if bit == "0" else actual.der
        if actual is None:
            raise ValueError("El mensaje contiene una ruta inexistente en el árbol.")
        if actual.simbolo is not None:
            resultado.append(actual.simbolo)
            actual = raiz

    if actual is not raiz:
        raise ValueError("El mensaje termina a mitad de un código Huffman.")
    return "".join(resultado)

def comprimir_huffman(texto):
    raiz = construir_arbol_huffman(texto)
    codigos = generar_codigos_huffman(raiz)
    return raiz, codigos, codificar_huffman(texto, codigos)

# ============================================================
# EJECUCIÓN Y RESULTADOS
# ============================================================
if __name__ == "__main__":
    print("=" * 60)
    print("RED DE ACUEDUCTO COMUNITARIO")
    print("=" * 60)

    # 2. Lista de adyacencia
    adj = construir_lista_adyacencia(ARISTAS, NODOS)
    print("\n[LISTA DE ADYACENCIA]")
    for n in NODOS:
        print(f"  {n}: {adj[n]}")

    # 3. Kruskal
    mst_k, costo_k = kruskal(ARISTAS, NODOS)
    print("\n[KRUSKAL] MST:")
    for u, v, w in mst_k:
        print(f"  {u} — {v}  (costo {w})")
    print(f"  Costo total = {costo_k} millones")

    # 4. Prim
    mst_p, costo_p = prim(adj, "T")
    print("\n[PRIM desde T] MST:")
    for u, v, w in mst_p:
        print(f"  {u} — {v}  (costo {w})")
    print(f"  Costo total = {costo_p} millones")

    # 5. BFS
    dist, orden_bfs = bfs(adj, "T")
    print("\n[BFS desde T]")
    for n, d in sorted(dist.items(), key=lambda x: x[1]):
        print(f"  {n}: {d} saltos")
    print(f"  Orden BFS: {' → '.join(orden_bfs)}")

    # 6. DFS
    orden_dfs, ciclos = dfs(adj, "T")
    print("\n[DFS desde T]")
    print(f"  Orden: {' → '.join(orden_dfs)}")
    print(f"  Aristas de retroceso (ciclos): {ciclos}")

    # 7. BST
    medidores = [(105, "A"), (102, "B"), (110, "C"),
                 (98, "D"), (115, "F"), (107, "E")]
    raiz = None
    for cod, ubi in medidores:
        raiz = insertar(raiz, cod, ubi)
    print("\n[BST DE MEDIDORES]")
    print(f"  In-order: {in_order(raiz)}")
    pasos = [0]
    resultado = buscar(raiz, 107, pasos)
    print(f"  Búsqueda 107 → encontrado en {resultado.ubicacion if resultado else 'N/A'}"
          f" en {pasos[0]} comparaciones")

    # 8. Bubble sort
    solicitudes = [
        ("R1", "Fuga en A", 4),
        ("R2", "Bomba dañada en E", 5),
        ("R3", "Medidor en C", 2),
        ("R4", "Tubería en D", 3),
        ("R5", "Presión baja en F", 1),
    ]
    ordenadas = bubble_sort_reparaciones(solicitudes)
    print("\n[BUBBLE SORT] Solicitudes ordenadas por urgencia:")
    for sid, desc, urg in ordenadas:
        print(f"  {sid} | urgencia {urg} | {desc}")

    # 9. Greedy
    asignacion = asignar_tecnicos_greedy(ordenadas, num_tecnicos=2)
    print("\n[GREEDY] Asignación de técnicos:")
    for t in asignacion:
        print(f"  Técnico {t['id']} (libre en {t['libre_en']}h):")
        for sid, desc, ini, fin in t["tareas"]:
            print(f"    - {sid} [{ini}h-{fin}h] {desc}")

    # 10. LCS
    s1 = [10, 12, 15, 14, 13, 16, 18]
    s2 = [10, 12, 20, 14, 13, 16, 19]
    longitud, secuencia = lcs(s1, s2)
    print("\n[LCS] Comparación de históricos de consumo:")
    print(f"  S1 = {s1}")
    print(f"  S2 = {s2}")
    print(f"  LCS (longitud {longitud}) = {secuencia}")
    print(f"  Anomalía: 3.ª lectura cambió 15 → 20")

    # 11. Huffman
    mensaje = "FUGA DE AGUA"
    raiz_huffman, codigos_huffman, bits = comprimir_huffman(mensaje)
    bits_originales = len(mensaje.encode("utf-8")) * 8
    ahorro = bits_originales - len(bits)
    porcentaje = (ahorro / bits_originales * 100) if bits_originales else 0
    print("\n[HUFFMAN] Compresión de telemetría:")
    print(f"  Mensaje: {mensaje!r}")
    print(f"  Códigos: {codigos_huffman}")
    print(f"  Codificado: {bits}")
    print(f"  Decodificado: {decodificar_huffman(bits, raiz_huffman)!r}")
    print(f"  Bits UTF-8 originales: {bits_originales}")
    print(f"  Bits codificados: {len(bits)} (sin contar el árbol ni sus metadatos)")
    print(f"  Ahorro estimado: {ahorro} bits ({porcentaje:.1f}%)")