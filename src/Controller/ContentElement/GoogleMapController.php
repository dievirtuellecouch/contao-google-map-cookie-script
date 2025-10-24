<?php

namespace Websailing\GoogleMapBundle\Controller\ContentElement;

use Contao\ContentModel;
use Contao\CoreBundle\DependencyInjection\Attribute\AsContentElement;
use Contao\CoreBundle\Controller\ContentElement\AbstractContentElementController;
use Contao\Template;
use Contao\BackendTemplate;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

#[AsContentElement(GoogleMapController::TYPE, category: 'miscellaneous', template: 'ce_google_map')]
class GoogleMapController extends AbstractContentElementController
{
    public const TYPE = 'google_map';

    protected function getResponse(Template $template, ContentModel $model, Request $request): Response
    {
        if ('backend' === ($request->attributes->get('_scope') ?? '')) {
            $be = new BackendTemplate('be_wildcard');
            $be->wildcard = '### GOOGLE MAP ###';
            $be->id = $model->id;
            $be->link = (string) ($model->headline ?? 'Google Map');
            $be->href = '';
            return $be->getResponse();
        }

        // Register bundle CSS asset
        if (!isset($GLOBALS['TL_CSS']['websailing_google_map'])) {
            $GLOBALS['TL_CSS']['websailing_google_map'] = 'bundles/websailinggooglemap/css/google_map.css|static';
        }

        $apiKey = (string) ($model->gmApiKey ?? '');
        if ($apiKey === '') {
            $env = $_ENV['GOOGLE_MAPS_API_KEY'] ?? $_SERVER['GOOGLE_MAPS_API_KEY'] ?? \getenv('GOOGLE_MAPS_API_KEY');
            $apiKey = (string) ($env ?: '');
        }

        $template->apiKey = $apiKey;
        $template->address = (string) ($model->gmAddress ?? '');
        $template->latitude = (float) ($model->gmLatitude ?? 0);
        $template->longitude = (float) ($model->gmLongitude ?? 0);
        $template->zoom = (int) ($model->gmZoom ?? 10);
        $template->height = (string) ($model->gmHeight ?? '300');
        $template->marker = (bool) ($model->gmMarker ?? false);
        $template->markerTitle = (string) ($model->gmMarkerTitle ?? '');
        $template->mapColor = (string) ($model->gmMapColor ?? '');
        $template->styleJson = (string) ($model->gmStyleJson ?? '');

        return $template->getResponse();
    }
}
