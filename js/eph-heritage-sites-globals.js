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
  Q7248 : { org: 'BKT', name: 'Kota Bukittingg'    , order: 2 },
  Q7258 : { org: 'PRM', name: 'Kota Pariaman' , order: 3 },
  // Tambahkan ID Kab/Kota lain di sini dan pastikan urutannya (order) diteruskan
}

// 4. SPARQL_QUERY_0: Mengambil data dan "menipu" variabel designation
const SPARQL_QUERY_0 =
`SELECT ?siteQid ?siteLabel ?designationQid WHERE {
  {
    # Ganti wd:Q32 dengan ID Cagar Budaya/Situs jika bukan mencari Masjid
    ?site wdt:P31 wd:Q32815 . 
    
    # Gunakan P131+ (rekursif) agar otomatis melacak dari Nagari -> Kec -> Kab/Kota
    ?site wdt:P131+ ?designation .
    
    # Masukkan QID Kab/Kota yang sama dengan yang ada di DESIGNATION_TYPES
    FILTER ( ?designation IN (
      wd:Q7253, wd:Q7248, wd:Q7258
    ))
  }
  ?site rdfs:label ?siteLabel . FILTER(LANG(?siteLabel) = "id") .
  
  BIND (SUBSTR(STR(?site       ), 32) AS ?siteQid       ) .
  # Sistem JavaScript sekarang mengira Kab/Kota adalah Designation!
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

// 6. SPARQL_QUERY_2: Diubah agar tidak mencari P31, tapi mencari P131 (Lokasi)
// 6. SPARQL_QUERY_2: Diubah agar tidak mencari P31, tapi mencari P131 (Lokasi)
// 6. SPARQL_QUERY_2: Disederhanakan HANYA untuk menarik tahun tanpa memfilter wilayah lagi
const SPARQL_QUERY_2 =
`SELECT ?siteQid ?tahunBerdiri WHERE {
  <SPARQLVALUESCLAUSE>
  
  OPTIONAL { 
    ?site wdt:P571 ?waktu . 
    BIND(YEAR(?waktu) AS ?tahunBerdiri)
  }
  
  BIND (SUBSTR(STR(?site), 32) AS ?siteQid) .
}`;
// 7. SPARQL_QUERY_3: Tetap sama (Mengambil gambar dan link Wikipedia)
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

// 8. ABOUT_SPARQL_QUERY: Disesuaikan menggunakan logika wilayah, bukan tipe cagar
const ABOUT_SPARQL_QUERY =
`SELECT ?site ?siteLabel ?designationLabel ?coord ?image ?wikipedia WHERE {
  {
    ?site wdt:P31 wd:Q32815 . # Masjid
    ?site wdt:P131+ ?designation .
    FILTER ( ?designation IN (
      wd:Q7253, wd:Q7248, wd:Q7258
    ))
  }
  OPTIONAL {
    ?site p:P625 ?coordStatement .
    ?coordStatement ps:P625 ?coord .
    FILTER NOT EXISTS { ?coordStatement pq:P518 ?x }
  }
  OPTIONAL { ?site wdt:P18 ?image }
  OPTIONAL {
    ?wikipedia schema:about ?site ;
               schema:isPartOf <https://id.wikipedia.org/> .
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "id,en" }
}`;

// Globals
var DesignationIndex;
