public static class Calculator
{
    public static int Fib(int value) 
    {
        if (value <= 1) return value;
        return Fib(value - 1) + Fib(value - 2);
    }
}