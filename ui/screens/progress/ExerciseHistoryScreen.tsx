import { Surface, Text, Table, TableCell, TableHead, TableRow } from '@ui/atoms';
import { ScreenHeader, Badge } from '@ui/molecules';
import { Grid } from '@ui/layout';
import { ExerciseHistoryChart } from '@ui/components/progress/ExerciseHistoryChart';
import { formatDate, formatDateFull, useExerciseHistory } from './useExerciseHistory';

export function ExerciseHistoryScreen() {
  const {
    exerciseName,
    navigate,
    notFound,
    progression,
    points,
    bands,
    dividers,
    yMax,
    xMax,
    maxSets,
    reversed,
  } = useExerciseHistory();

  if (notFound) {
    return (
      <Grid>
        <ScreenHeader title={exerciseName} back={() => navigate(-1)} />
        <Surface as="section" className="pad-sm">
          <Text as="p" size="caption">No history found for "{exerciseName}".</Text>
        </Surface>
      </Grid>
    );
  }

  return (
    <Grid>
      <ScreenHeader
        title={exerciseName}
        back={() => navigate(-1)}
        primary={progression?.plateauDetected ? <Badge tone="warn">Plateau</Badge> : undefined}
      />

      {points.length >= 1 && (
        <ExerciseHistoryChart
          points={points}
          bands={bands}
          dividers={dividers}
          xMax={xMax}
          yMax={yMax}
          formatDate={formatDate}
        />
      )}

      <Surface as="section" className="pad-sm column">
        <Text size="caption">Session history</Text>
        <Table className="center">
          <TableHead>
            <TableRow>
              <TableCell header><Text size="caption">Date</Text></TableCell>
              {Array.from({ length: maxSets }, (_, i) => (
                <TableCell key={i} header><Text size="caption">S{i + 1}</Text></TableCell>
              ))}
              <TableCell header><Text size="caption">1RM</Text></TableCell>
            </TableRow>
          </TableHead>
          <tbody>
            {reversed.map((entry, i) => (
              <TableRow key={i}>
                <TableCell><Text size="caption" nowrap>{formatDateFull(entry.date)}</Text></TableCell>
                {Array.from({ length: maxSets }, (_, s) => {
                  const kg = entry.setWeights?.[s];
                  const reps = entry.setReps?.[s];
                  if (kg == null) return <TableCell key={s}>-</TableCell>;
                  return (
                    <TableCell key={s}>
                      {kg}<Text size="caption"> x{reps ?? '?'}</Text>
                    </TableCell>
                  );
                })}
                <TableCell>{entry.oneRepMaxEstimate.toFixed(1)}</TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </Surface>
    </Grid>
  );
}
