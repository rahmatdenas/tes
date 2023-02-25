'use strict';

// Constants and fixed parameters
const BASE_TITLE = 'Heritage Sites Map – Encyclopedia of Philippine Heritage';
const ORGS = {
  NHCP   : 'National Historical Commission of the Philippines',
  NM     : 'National Museum',
  DENR   : 'Department of Environment and Natural Resources',
  WHC    : 'UNESCO World Heritage Committee',
  RAMSAR : 'Ramsar Convention',
  ASEAN  : 'ASEAN Center for Biodiversity',
}
const DESIGNATION_TYPES = {
  Q32815 : { org: 'NHCP'  , name: 'National Historical Landmark' , order: 101 },
}
const SPARQL_QUERY_0 =
`SELECT ?siteQid ?siteLabel ?designationQid WHERE {
  # National heritage site designations
  {
    ?site wdt:P31 ?designation .
    ?site wdt:P17 wd:Q252 .
    FILTER ( ?designation IN (
      wd:Q32815  # National Historical Landmark
    ))
  }
  ?site rdfs:label ?siteLabel . FILTER(LANG(?siteLabel) = "id") .
  BIND (SUBSTR(STR(?site       ), 32) AS ?siteQid       ) .
  BIND (SUBSTR(STR(?designation), 32) AS ?designationQid) .
} ORDER BY ?siteLabel`;
const SPARQL_QUERY_1 =
`SELECT ?siteQid ?coord WHERE {
  <SPARQLVALUESCLAUSE>
  ?site p:P625 ?coordStatement .
  ?coordStatement ps:P625 ?coord .
  # Do not include coordinates for parts
  FILTER NOT EXISTS { ?coordStatement pq:P518 ?x }
  BIND (SUBSTR(STR(?site), 32) AS ?siteQid) .
}`;
//    ?site wdt:P527 ?sitePart .
const SPARQL_QUERY_2 =
`SELECT ?siteQid ?designationQid ?declared ?declaredPrecision
       ?declaration ?declarationTitle ?declarationScan ?declarationText WHERE {
  <SPARQLVALUESCLAUSE>
  ?site p:P31 ?designationStatement .
  ?designationStatement ps:P31 ?designation .
  FILTER ( ?designation IN (
    wd:Q32815  # National Historical Landmark
  ))
  OPTIONAL {
    ?designationStatement pqv:P580 ?declaredValue .
    ?declaredValue wikibase:timeValue ?declared ;
                   wikibase:timePrecision ?declaredPrecision .
  }
  OPTIONAL {
    ?designationStatement pq:P457 ?declaration .
    ?declaration wdt:P1476 ?declarationTitle .
    OPTIONAL { ?declaration wdt:P996 ?declarationScan }
    OPTIONAL {
      ?declarationText schema:about ?declaration ;
                       schema:isPartOf <https://en.wikisource.org/> .
    }
  }
  BIND (SUBSTR(STR(?site       ), 32) AS ?siteQid       ) .
  BIND (SUBSTR(STR(?designation), 32) AS ?designationQid) .
}`;
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
const ABOUT_SPARQL_QUERY =
`SELECT ?site ?siteLabel ?designationLabel ?declared ?declaration ?declarationTitle
       ?coord ?image ?wikipedia WHERE {
  # National heritage site designations
  {
    ?site p:P31 ?designationStatement .
    ?designationStatement ps:P31 ?designation .
    FILTER ( ?designation IN (
      wd:Q32815  # National Historical Landmark
    ))
  }
  OPTIONAL { ?designationStatement pq:P580 ?declared }
  OPTIONAL {
    ?designationStatement pq:P457 ?declaration .
    ?declaration wdt:P1476 ?declarationTitle .
  }
  OPTIONAL {
    ?site p:P625 ?coordStatement .
    ?coordStatement ps:P625 ?coord .
    # Do not include coordinates for parts
    FILTER NOT EXISTS { ?coordStatement pq:P518 ?x }
  }
  OPTIONAL { ?site wdt:P18 ?image }
  OPTIONAL {
    ?wikipedia schema:about ?site ;
               schema:isPartOf <https://id.wikipedia.org/> .
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
}`;

// Globals
var DesignationIndex;  // Index of designation types
