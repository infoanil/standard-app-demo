<?php

namespace App\Http\Controllers\Internal;

use App\Http\Controllers\Controller;
use App\Models\CustomerQuery;
use Illuminate\Http\Request;

class CustomerQueryController extends Controller
{
    public function index()
    {
        $queries = CustomerQuery::with('user')->get();

        return view('customer_queries.index', compact('queries'));
    }
    public function store(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'content' => 'required|string',
        ], [
            'email.required' => 'Please enter a valid email address.',
            'email.email' => 'Please enter a valid email address.',
            'content.required' => 'Please enter content details.',
        ]);

        try {
            CustomerQuery::create([
                'from_email' => $validated['email'],
                'content' => $validated['content'],
                'user_id' => auth()->id() ?? null, // Optional user_id
            ]);

            return response()->json(['message' => 'Query submitted successfully.'], 201);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Unable to submit query.'], 500);
        }
    }
}
