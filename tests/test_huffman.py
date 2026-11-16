import unittest

from proyecto import (
    codificar_huffman,
    comprimir_huffman,
    construir_arbol_huffman,
    decodificar_huffman,
    generar_codigos_huffman,
)


class HuffmanTests(unittest.TestCase):
    def test_round_trip_and_prefix_free_codes(self):
        texto = "FUGA DE AGUA"
        raiz, codigos, bits = comprimir_huffman(texto)

        self.assertEqual(decodificar_huffman(bits, raiz), texto)
        self.assertTrue(all(codigos.values()))
        self.assertFalse(any(
            otro.startswith(codigo)
            for simbolo, codigo in codigos.items()
            for otro_simbolo, otro in codigos.items()
            if simbolo != otro_simbolo
        ))

    def test_empty_message(self):
        raiz, codigos, bits = comprimir_huffman("")

        self.assertIsNone(raiz)
        self.assertEqual(codigos, {})
        self.assertEqual(bits, "")
        self.assertEqual(decodificar_huffman(bits, raiz), "")

    def test_single_symbol_uses_nonempty_code(self):
        raiz, codigos, bits = comprimir_huffman("AAAA")

        self.assertEqual(codigos, {"A": "0"})
        self.assertEqual(bits, "0000")
        self.assertEqual(decodificar_huffman(bits, raiz), "AAAA")

    def test_invalid_encoded_message_is_rejected(self):
        raiz = construir_arbol_huffman("ABBCCC")

        with self.assertRaises(ValueError):
            decodificar_huffman("2", raiz)
        with self.assertRaises(ValueError):
            decodificar_huffman("1", raiz)

    def test_encoding_unknown_symbol_is_rejected(self):
        with self.assertRaises(ValueError):
            codificar_huffman("B", generar_codigos_huffman(
                construir_arbol_huffman("A")
            ))


if __name__ == "__main__":
    unittest.main()
