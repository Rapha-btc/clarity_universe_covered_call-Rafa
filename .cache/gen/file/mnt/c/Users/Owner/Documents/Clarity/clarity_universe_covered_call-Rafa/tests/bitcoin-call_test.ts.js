import { Clarinet } from 'https://deno.land/x/clarinet@v1.4.2/index.ts';
import { assertEquals } from 'https://deno.land/std@0.170.0/testing/asserts.ts';
Clarinet.test({
    name: "Ensure that <...>",
    async fn (chain, accounts) {
        let block = chain.mineBlock([]);
        assertEquals(block.receipts.length, 0);
        assertEquals(block.height, 2);
        block = chain.mineBlock([]);
        assertEquals(block.receipts.length, 0);
        assertEquals(block.height, 3);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vbW50L2MvVXNlcnMvT3duZXIvRG9jdW1lbnRzL0NsYXJpdHkvY2xhcml0eV91bml2ZXJzZV9jb3ZlcmVkX2NhbGwtUmFmYS90ZXN0cy9iaXRjb2luLWNhbGxfdGVzdC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJcbmltcG9ydCB7IENsYXJpbmV0LCBUeCwgQ2hhaW4sIEFjY291bnQsIHR5cGVzIH0gZnJvbSAnaHR0cHM6Ly9kZW5vLmxhbmQveC9jbGFyaW5ldEB2MS40LjIvaW5kZXgudHMnO1xuaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSAnaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQDAuMTcwLjAvdGVzdGluZy9hc3NlcnRzLnRzJztcblxuQ2xhcmluZXQudGVzdCh7XG4gICAgbmFtZTogXCJFbnN1cmUgdGhhdCA8Li4uPlwiLFxuICAgIGFzeW5jIGZuKGNoYWluOiBDaGFpbiwgYWNjb3VudHM6IE1hcDxzdHJpbmcsIEFjY291bnQ+KSB7XG4gICAgICAgIGxldCBibG9jayA9IGNoYWluLm1pbmVCbG9jayhbXG4gICAgICAgICAgICAvKlxuICAgICAgICAgICAgICogQWRkIHRyYW5zYWN0aW9ucyB3aXRoOlxuICAgICAgICAgICAgICogVHguY29udHJhY3RDYWxsKC4uLilcbiAgICAgICAgICAgICovXG4gICAgICAgIF0pO1xuICAgICAgICBhc3NlcnRFcXVhbHMoYmxvY2sucmVjZWlwdHMubGVuZ3RoLCAwKTtcbiAgICAgICAgYXNzZXJ0RXF1YWxzKGJsb2NrLmhlaWdodCwgMik7XG5cbiAgICAgICAgYmxvY2sgPSBjaGFpbi5taW5lQmxvY2soW1xuICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAqIEFkZCB0cmFuc2FjdGlvbnMgd2l0aDpcbiAgICAgICAgICAgICAqIFR4LmNvbnRyYWN0Q2FsbCguLi4pXG4gICAgICAgICAgICAqL1xuICAgICAgICBdKTtcbiAgICAgICAgYXNzZXJ0RXF1YWxzKGJsb2NrLnJlY2VpcHRzLmxlbmd0aCwgMCk7XG4gICAgICAgIGFzc2VydEVxdWFscyhibG9jay5oZWlnaHQsIDMpO1xuICAgIH0sXG59KTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxTQUFTLFFBQVEsUUFBbUMsOENBQThDLENBQUM7QUFDbkcsU0FBUyxZQUFZLFFBQVEsa0RBQWtELENBQUM7QUFFaEYsUUFBUSxDQUFDLElBQUksQ0FBQztJQUNWLElBQUksRUFBRSxtQkFBbUI7SUFDekIsTUFBTSxFQUFFLEVBQUMsS0FBWSxFQUFFLFFBQThCLEVBQUU7UUFDbkQsSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxFQUszQixDQUFDLEFBQUM7UUFDSCxZQUFZLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdkMsWUFBWSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFOUIsS0FBSyxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsRUFLdkIsQ0FBQyxDQUFDO1FBQ0gsWUFBWSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3ZDLFlBQVksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO0tBQ2pDO0NBQ0osQ0FBQyxDQUFDIn0=