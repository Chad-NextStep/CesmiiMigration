<?php
/**
 * proxy.php — HubSpot content proxy (function library; not a web endpoint).
 *
 * Included by generated .php pages. Direct web access is blocked by nginx.
 * Usage in a generated page:
 *   require_once $_SERVER['DOCUMENT_ROOT'] . '/proxy.php';
 *   echo hs_fetch('https://43818189.hs-sites.com/page-slug');
 */

// Belt-and-suspenders guard — nginx blocks direct requests, but just in case.
if (__FILE__ === realpath($_SERVER['SCRIPT_FILENAME'] ?? '')) {
    http_response_code(404);
    exit;
}

const HS_ALLOWED_HOST  = '43818189.hs-sites.com';
const HS_CACHE_TTL     = 3600;  // seconds; cached in system temp dir
const HS_FETCH_TIMEOUT = 10;    // curl timeout in seconds

/**
 * Fetch a HubSpot page and return a clean HTML fragment.
 * Caches results on disk; serves stale cache if upstream is unreachable.
 */
function hs_fetch(string $url): string {
    if (!str_starts_with($url, 'https://' . HS_ALLOWED_HOST . '/')) {
        return _hs_error('Disallowed URL.');
    }

    $cache_file = sys_get_temp_dir() . '/cesmii_' . md5($url) . '.html';

    if (is_file($cache_file) && (time() - filemtime($cache_file)) < HS_CACHE_TTL) {
        $cached = file_get_contents($cache_file);
        if ($cached !== false && $cached !== '') return $cached;
    }

    $html = _hs_curl($url);

    if ($html === null) {
        // Prefer stale cache over an error page when upstream is down.
        if (is_file($cache_file)) {
            $stale = file_get_contents($cache_file);
            if ($stale !== false && $stale !== '') return $stale;
        }
        return _hs_error('Content temporarily unavailable.');
    }

    $fragment = _hs_extract($html, $url);
    @file_put_contents($cache_file, $fragment);
    return $fragment;
}

function _hs_curl(string $url): ?string {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS      => 5,
        CURLOPT_TIMEOUT        => HS_FETCH_TIMEOUT,
        CURLOPT_USERAGENT      => 'Mozilla/5.0 (compatible; CESMII-Proxy/1.0)',
        CURLOPT_ENCODING       => '',       // accept gzip/deflate
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    $body   = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return ($body !== false && $status >= 200 && $status < 300) ? $body : null;
}

/**
 * Strip HubSpot chrome and return the page content as an HTML fragment.
 * Prefers <main>; falls back to <body> after removing header/footer/nav.
 */
function _hs_extract(string $html, string $source_url): string {
    $dom = new DOMDocument();
    @$dom->loadHTML($html, LIBXML_NOERROR | LIBXML_NOWARNING);
    $xpath = new DOMXPath($dom);

    foreach (['script', 'style', 'link', 'noscript', 'header', 'footer', 'nav', 'iframe'] as $tag) {
        foreach (iterator_to_array($xpath->query("//{$tag}")) as $node) {
            $node->parentNode?->removeChild($node);
        }
    }

    $container = $xpath->query('//main')->item(0)
              ?? $xpath->query('//body')->item(0);

    if ($container === null) {
        return _hs_error('Could not extract page content.');
    }

    $fragment = '';
    foreach ($container->childNodes as $child) {
        $fragment .= $dom->saveHTML($child);
    }

    return _hs_rewrite_urls(trim($fragment), $source_url);
}

/**
 * Rewrite root-relative src/href attributes to absolute URLs so images and
 * links that point to paths on the HubSpot domain resolve correctly.
 */
function _hs_rewrite_urls(string $html, string $source_url): string {
    $parts  = parse_url($source_url);
    $origin = $parts['scheme'] . '://' . $parts['host'];

    return preg_replace_callback(
        '/(src|href)="(\/[^"]*)"/i',
        fn($m) => $m[1] . '="' . $origin . $m[2] . '"',
        $html
    );
}

function _hs_error(string $msg): string {
    return '<div class="content-error">' . htmlspecialchars($msg, ENT_QUOTES) . '</div>';
}
