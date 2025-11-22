<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Customer Queries</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f9f9f9;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        h1 {
            font-size: 24px;
            margin-bottom: 20px;
            color: #333;
            text-align: center;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }

        table th, table td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
        }

        table th {
            background-color: #f4f4f4;
            font-weight: bold;
        }

        table tr:nth-child(even) {
            background-color: #f9f9f9;
        }

        table tr:hover {
            background-color: #f1f1f1;
        }

        .text-center {
            text-align: center;
        }

        .no-data {
            color: #777;
            font-style: italic;
        }
    </style>
</head>
<body>
<div class="container">
    <h1>Customer Queries</h1>

    <table>
        <thead>
        <tr>
            <th>ID</th>
            <th>User</th>
            <th>Email</th>
            <th>Query Content</th>
            <th>Created At</th>
        </tr>
        </thead>
        <tbody>
        @forelse($queries as $query)
            <tr>
                <td>{{ $query->id }}</td>
                <td>{{ $query->user ? $query->user->name : 'Guest' }}</td> <!-- Assuming User model has 'name' -->
                <td>{{ $query->from_email }}</td>
                <td>{{ $query->content }}</td>
                <td>{{ $query->created_at->format('Y-m-d H:i') }}</td>
            </tr>
        @empty
            <tr>
                <td colspan="5" class="text-center no-data">No queries found.</td>
            </tr>
        @endforelse
        </tbody>
    </table>
</div>
</body>
</html>
