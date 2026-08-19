<?php

namespace App\Database;

use Illuminate\Database\Connectors\PostgresConnector;

/**
 * Neon's pooled/direct hostnames route to the right compute endpoint via TLS
 * SNI. The libpq bundled with XAMPP's PHP build predates SNI support, so Neon
 * falls back to reading the endpoint ID from the Postgres `options` startup
 * parameter instead (see https://neon.tech/sni). Laravel's stock
 * PostgresConnector has no hook for that, so this subclass appends it to the
 * DSN — the endpoint ID is just the first label of the host.
 */
class NeonPostgresConnector extends PostgresConnector
{
    protected function getDsn(array $config)
    {
        $dsn = parent::getDsn($config);

        $host = $config['host'] ?? null;
        if (is_array($host)) {
            $host = $host[0] ?? null;
        }

        if ($host && str_ends_with($host, '.neon.tech')) {
            $endpointId = strstr($host, '.', true);
            $dsn .= ";options='endpoint={$endpointId}'";
        }

        return $dsn;
    }
}
