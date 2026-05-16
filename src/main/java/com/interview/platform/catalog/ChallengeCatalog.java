package com.interview.platform.catalog;

import com.interview.platform.domain.Challenge;
import com.interview.platform.domain.Difficulty;

import java.util.List;

public interface ChallengeCatalog {
    List<Challenge> listAll();

    default List<Challenge> byDifficulty(Difficulty difficulty) {
        return listAll().stream().filter(c -> c.difficulty() == difficulty).toList();
    }
}
