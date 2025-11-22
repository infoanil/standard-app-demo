<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="shopify-api-key" content="{{ config('shopify-app.api_key') }}" />

    <title>{{ config('shopify-app.app_name') }}</title>

    <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
</head>
<body>
    <div class="container app" id="app"></div>

    <script  src="{{ mix('js/app.js') }}"></script>
    @production
        <script src="https://cdn.jotfor.ms/agent/embedjs/019903f705c574e59483d1a2914d5f3129ee/embed.js"></script>
    @endproduction
</body>
</html>
