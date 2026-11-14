from collections import deque
import heapq

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


# EJECUCIÓN Y RESULTADOS

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
