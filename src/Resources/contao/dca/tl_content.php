<?php

// Palette for the Google Map content element
$GLOBALS['TL_DCA']['tl_content']['palettes']['google_map'] = '{type_legend},type,headline;{map_legend},gmAddress,gmLatitude,gmLongitude,gmZoom,gmHeight,gmMarker,gmMarkerTitle,gmApiKey;{style_legend},gmMapColor,gmStyleJson;{template_legend:hide},customTpl;{protected_legend:hide},protected;{expert_legend:hide},cssID,space';

$GLOBALS['TL_DCA']['tl_content']['fields']['gmAddress'] = [
    'label' => ['Adresse', 'Adresse oder Bezeichnung des Standorts'],
    'exclude' => true,
    'inputType' => 'text',
    'eval' => ['maxlength' => 255, 'tl_class' => 'w50'],
    'sql'  => "varchar(255) NOT NULL default ''",
];

$GLOBALS['TL_DCA']['tl_content']['fields']['gmLatitude'] = [
    'label' => ['Breitengrad', 'z. B. 48.137154'],
    'exclude' => true,
    'inputType' => 'text',
    'eval' => ['maxlength' => 32, 'tl_class' => 'w50'],
    'sql'  => "varchar(32) NOT NULL default ''",
];

$GLOBALS['TL_DCA']['tl_content']['fields']['gmLongitude'] = [
    'label' => ['Längengrad', 'z. B. 11.576124'],
    'exclude' => true,
    'inputType' => 'text',
    'eval' => ['maxlength' => 32, 'tl_class' => 'w50'],
    'sql'  => "varchar(32) NOT NULL default ''",
];

$GLOBALS['TL_DCA']['tl_content']['fields']['gmZoom'] = [
    'label' => ['Zoom/Skalierung', 'Karten-Zoomstufe (1-21)'],
    'exclude' => true,
    'inputType' => 'text',
    'eval' => ['rgxp' => 'digit', 'maxlength' => 2, 'tl_class' => 'w50'],
    'sql'  => "int(10) unsigned NOT NULL default '10'",
];

$GLOBALS['TL_DCA']['tl_content']['fields']['gmHeight'] = [
    'label' => ['Höhe (px)', 'Höhe der Karte in Pixeln'],
    'exclude' => true,
    'inputType' => 'text',
    'eval' => ['rgxp' => 'digit', 'maxlength' => 5, 'tl_class' => 'w50'],
    'sql'  => "varchar(8) NOT NULL default '300'",
];

$GLOBALS['TL_DCA']['tl_content']['fields']['gmMarker'] = [
    'label' => ['Marker anzeigen', 'Einen Marker in der Kartenmitte anzeigen'],
    'exclude' => true,
    'inputType' => 'checkbox',
    'eval' => ['tl_class' => 'w50 m12'],
    'sql'  => "char(1) NOT NULL default ''",
];

$GLOBALS['TL_DCA']['tl_content']['fields']['gmMarkerTitle'] = [
    'label' => ['Marker Titel', 'Markertitel/Tooltip'],
    'exclude' => true,
    'inputType' => 'text',
    'eval' => ['maxlength' => 255, 'tl_class' => 'w50'],
    'sql'  => "varchar(255) NOT NULL default ''",
];

$GLOBALS['TL_DCA']['tl_content']['fields']['gmApiKey'] = [
    'label' => ['API Key (optional)', 'Google Maps API Key, leer lassen um Umgebungsvariable zu nutzen'],
    'exclude' => true,
    'inputType' => 'text',
    'eval' => ['maxlength' => 255, 'tl_class' => 'clr w50'],
    'sql'  => "varchar(255) NOT NULL default ''",
];

$GLOBALS['TL_DCA']['tl_content']['fields']['gmMapColor'] = [
    'label' => ['Einfärbung (optional)', 'Hex-Farbe zur Einfärbung der Karte, z. B. #4CAF50'],
    'exclude' => true,
    'inputType' => 'text',
    'eval' => ['maxlength' => 7, 'tl_class' => 'w50'],
    'sql'  => "varchar(7) NOT NULL default ''",
];

$GLOBALS['TL_DCA']['tl_content']['fields']['gmStyleJson'] = [
    'label' => ['Stil JSON (optional)', 'Google Maps Styles JSON für individuelle Einfärbung'],
    'exclude' => true,
    'inputType' => 'textarea',
    'eval' => ['rte' => 'none', 'decodeEntities' => true, 'tl_class' => 'clr'],
    'sql'  => "mediumtext NULL",
];
