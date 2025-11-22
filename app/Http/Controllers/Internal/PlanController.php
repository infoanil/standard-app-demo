<?php

namespace App\Http\Controllers\Internal;

use App\Http\Controllers\Controller;
use App\Interfaces\Internal\PlanRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlanController extends Controller
{
    private PlanRepositoryInterface $planRepository;

    public function __construct(PlanRepositoryInterface $planRepository)
    {
        $this->planRepository = $planRepository;
    }


    public function index(Request $request): JsonResponse
    {
        $shop = $request->user();
        $plansData = $this->planRepository->getPlans($shop);

        return response()->json($plansData);
    }

    public function completeOnboard(Request $request)
    {
        $shop = $request->user();
        $shop->update(['onboarding' => true]);

        return response(['message' => 'Onboarded successfully']);
    }
}
