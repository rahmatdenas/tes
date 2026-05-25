'use strict';

// 1. UBAH JUDUL PETA
const BASE_TITLE = 'Peta Persebaran Masjid – Sumatera Barat';

// 2. ORGS: Kita akali menjadi singkatan nama daerah untuk label
const ORGS = {
  PDG: 'Kota Padang',
  PRM: 'Kota Pariaman',
  BKT: 'Kota Bukittinggi',
  AGM: 'Kabupaten Agam',
  // Tambahkan singkatan lain jika perlu
}

// 3. DESIGNATION_TYPES: Kita akali dengan ID Wikidata Kabupaten/Kota
// Ini yang akan dibaca oleh Dropdown template Anda
const DESIGNATION_TYPES = {
  Q7253 : { org: 'PDG', name: 'Kota Padang'      , order: 1 },
  Q7248 : { org: 'BKT', name: 'Kota Bukittinggi' , order: 2 },
  Q7258 : { org: 'PRM', name: 'Kota Pariaman'    , order: 3 },
  // Tambahkan ID Kab/Kota lain di sini dan pastikan urutannya (order) diteruskan
}

// 4. SPARQL_QUERY_0: Mengambil data lokasi dan LANGSUNG menarik Tahun Berdiri
// 4. SPARQL_QUERY_0: Mengambil data masjid, filter wilayah, dan properti P131 langsung
const SPARQL_QUERY_0 =
`SELECT ?siteQid ?siteLabel ?designationQid ?p131Label ?tahunBerdiriMentah WHERE {
  {
    ?site wdt:P31 wd:Q32815 . 
    ?site wdt:P131+ ?designation .
    FILTER ( ?designation IN ( wd:Q7253, wd:Q7248, wd:Q7258 ))
  }
  ?site rdfs:label ?siteLabel . FILTER(LANG(?siteLabel) = "id") .
  
  # AMBIL P131 LANGSUNG DARI ENTITAS MASJID BESERTA LABEL INDONESIANYA
  OPTIONAL {
    ?site wdt:P131 ?p131Lokasi .
    ?p131Lokasi rdfs:label ?p131Label .
    FILTER(LANG(?p131Label) = "id") .
  }
  
  OPTIONAL { ?site wdt:P571 ?tahunBerdiriMentah . }
  
  BIND (SUBSTR(STR(?site       ), 32) AS ?siteQid       ) .
  BIND (SUBSTR(STR(?designation), 32) AS ?designationQid) .
} ORDER BY ?siteLabel`;

// 5. SPARQL_QUERY_1: Tetap sama (Hanya mengambil koordinat P625)
const SPARQL_QUERY_1 =
`SELECT ?siteQid ?coord WHERE {
  <SPARQLVALUESCLAUSE>
  ?site p:P625 ?coordStatement .
  ?coordStatement ps:P625 ?coord .
  FILTER NOT EXISTS { ?coordStatement pq:P518 ?x }
  BIND (SUBSTR(STR(?site), 32) AS ?siteQid) .
}`;

// (CATATAN: SPARQL_QUERY_2 SUDAH KITA HAPUS SEPENUHNYA AGAR SERVER TIDAK DOWN)

// 6. SPARQL_QUERY_3: Tetap sama (Mengambil gambar dan link Wikipedia)
const SPARQL_QUERY_3 =
`SELECT ?siteQid ?image ?wikipediaUrlTitle WHERE {
  <SPARQLVALUESCLAUSE>
  OPTIONAL { ?site wdt:P18 ?image }
  OPTIONAL {
    ?wikipediaUrl schema:about ?site ;
                  schema:isPartOf <https://id.wikipedia.org/> .
  }
  BIND (SUBSTR(STR(?site        ), 32) AS ?siteQid          ) .
  BIND (SUBSTR(STR(?wikipediaUrl), 31) AS ?wikipediaUrlTitle) .
}`;

// 7. ABOUT_SPARQL_QUERY: Disesuaikan menggunakan logika wilayah
const ABOUT_SPARQL_QUERY =
`
`;

// Globals
var DesignationIndex;
var Records = {}; // Memastikan Records dideklarasikan jika template membutuhkannya
